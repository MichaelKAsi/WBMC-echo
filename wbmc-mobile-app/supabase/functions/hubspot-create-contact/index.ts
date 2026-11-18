import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/hubspot';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const HUBSPOT_API_KEY = Deno.env.get('HUBSPOT_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');
    if (!HUBSPOT_API_KEY) throw new Error('HUBSPOT_API_KEY is not configured');

    const body = await req.json().catch(() => ({}));
    const { email, firstName, lastName, phone, properties } = body ?? {};

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const props: Record<string, string> = {
      email,
      ...(firstName ? { firstname: String(firstName) } : {}),
      ...(lastName ? { lastname: String(lastName) } : {}),
      ...(phone ? { phone: String(phone) } : {}),
      ...(properties && typeof properties === 'object' ? properties : {}),
    };

    // Try create
    let res = await fetch(`${GATEWAY_URL}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': HUBSPOT_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties: props }),
    });

    let data = await res.json();

    // If already exists, update instead
    if (!res.ok && res.status === 409) {
      const updateRes = await fetch(
        `${GATEWAY_URL}/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': HUBSPOT_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ properties: props }),
        },
      );
      data = await updateRes.json();
      res = updateRes;
    }

    if (!res.ok) {
      throw new Error(`HubSpot API failed [${res.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, contact: data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('hubspot-create-contact error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
