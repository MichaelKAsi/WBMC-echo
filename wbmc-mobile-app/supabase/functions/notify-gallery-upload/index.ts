import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const TWILIO_URL = 'https://connector-gateway.lovable.dev/twilio';
const HUBSPOT_URL = 'https://connector-gateway.lovable.dev/hubspot';
const APP_URL = 'https://wbmc.netlify.app/?tab=gallery';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

function toE164(raw: string | null): string | null {
  if (!raw) return null;
  let n = raw.replace(/[^\d+]/g, '');
  if (n.startsWith('00')) n = '+' + n.slice(2);
  if (n.startsWith('0') && n.length === 10) n = '+27' + n.slice(1);
  if (!n.startsWith('+') && n.startsWith('27') && n.length === 11) n = '+' + n;
  return /^\+\d{10,15}$/.test(n) ? n : null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: userData, error: userErr } = await admin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userErr || !userData.user) return json({ error: 'Unauthorized' }, 401);
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userData.user.id, _role: 'admin' });
    if (!isAdmin) return json({ error: 'Forbidden' }, 403);

    const body = await req.json().catch(() => ({}));
    const slideId = body?.slideId;
    if (typeof slideId !== 'string' || !/^[0-9a-f-]{36}$/i.test(slideId)) return json({ error: 'slideId required' }, 400);

    const { data: slide } = await admin.from('gallery_slides').select('id,title,status').eq('id', slideId).maybeSingle();
    if (!slide || slide.status !== 'approved') return json({ error: 'Slide not found or not approved' }, 400);

    const { data: already } = await admin.from('gallery_notifications').select('id').eq('slide_id', slideId).maybeSingle();
    if (already) return json({ success: true, skipped: 'already_sent' });
    // Reserve to prevent double sends
    const { error: reserveErr } = await admin.from('gallery_notifications').insert({ slide_id: slideId });
    if (reserveErr) return json({ success: true, skipped: 'already_sent' });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY');
    const FROM = Deno.env.get('TWILIO_FROM_NUMBER');
    const HUBSPOT_API_KEY = Deno.env.get('HUBSPOT_API_KEY');

    const { data: recipients } = await admin
      .from('profiles')
      .select('email,phone_number,sms_gallery_opt_in,email_gallery_opt_in')
      .or('sms_gallery_opt_in.eq.true,email_gallery_opt_in.eq.true');

    let smsCount = 0, emailCount = 0;
    const errors: string[] = [];
    const message = `New photos on Echo: ${slide.title}. View: ${APP_URL} Reply STOP to opt out.`;

    // SMS
    if (LOVABLE_API_KEY && TWILIO_API_KEY && FROM) {
      const phones = [...new Set((recipients ?? []).filter((r) => r.sms_gallery_opt_in).map((r) => toE164(r.phone_number)).filter(Boolean))] as string[];
      for (const to of phones) {
        const res = await fetch(`${TWILIO_URL}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': TWILIO_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: to, From: FROM, Body: message }),
        });
        if (res.ok) smsCount++;
        else errors.push(`SMS [${res.status}]: ${(await res.text()).slice(0, 200)}`);
        await sleep(150);
      }
    } else {
      errors.push('SMS not configured (missing Twilio sender number)');
    }

    // HubSpot (email via HubSpot workflow)
    if (LOVABLE_API_KEY && HUBSPOT_API_KEY) {
      const now = new Date().toISOString().slice(0, 10);
      const emails = [...new Set((recipients ?? []).filter((r) => r.email_gallery_opt_in && r.email).map((r) => r.email!.toLowerCase()))];
      for (const email of emails) {
        const res = await fetch(`${HUBSPOT_URL}/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': HUBSPOT_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ properties: { last_gallery_update: now, last_gallery_title: slide.title } }),
        });
        if (res.ok) emailCount++;
        else errors.push(`HubSpot [${res.status}]: ${(await res.text()).slice(0, 200)}`);
        await sleep(120);
      }
    }

    await admin.from('gallery_notifications').update({ sms_count: smsCount, email_count: emailCount }).eq('slide_id', slideId);
    if (errors.length) console.error('notify-gallery-upload errors:', errors.slice(0, 10));
    return json({ success: true, smsCount, emailCount, errors: errors.slice(0, 5) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('notify-gallery-upload error:', msg);
    return json({ error: msg }, 500);
  }
});
