import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const USERS = [
  { email: "thabo.mentor@example.com", full_name: "Thabo Mokoena" },
  { email: "lerato.mentor@example.com", full_name: "Lerato Dlamini" },
  { email: "sipho.mentor@example.com", full_name: "Sipho Nkosi" },
  { email: "naledi.mentee@example.com", full_name: "Naledi Mahlangu" },
  { email: "kabelo.mentee@example.com", full_name: "Kabelo Mthembu" },
  { email: "ayanda.mentee@example.com", full_name: "Ayanda Zulu" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const results: Array<Record<string, unknown>> = [];
  for (const u of USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: "test123",
      email_confirm: true,
      user_metadata: { full_name: u.full_name },
    });
    let userId = data?.user?.id ?? null;
    if (error && !userId) {
      // already exists — look it up
      const { data: list } = await supabase.auth.admin.listUsers();
      userId = list?.users.find((x) => x.email === u.email)?.id ?? null;
    }
    if (userId) {
      await supabase
        .from("mentorship_applications")
        .update({ user_id: userId })
        .eq("email", u.email);
    }
    results.push({ email: u.email, user_id: userId, error: error?.message ?? null });
  }
  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
