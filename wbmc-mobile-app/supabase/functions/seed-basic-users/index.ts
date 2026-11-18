import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const USERS = [
  {
    email: "general.user@example.com",
    password: "Test1234!",
    first_name: "Grace",
    last_name: "General",
    is_wbmc_member: false,
  },
  {
    email: "church.member@example.com",
    password: "Test1234!",
    first_name: "Caleb",
    last_name: "Church",
    is_wbmc_member: true,
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results: Array<Record<string, unknown>> = [];

  for (const u of USERS) {
    const full_name = `${u.first_name} ${u.last_name}`;
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: {
        full_name,
        first_name: u.first_name,
        last_name: u.last_name,
        is_wbmc_member: u.is_wbmc_member,
      },
    });

    let userId = data?.user?.id ?? null;
    if (!userId) {
      const { data: list } = await supabase.auth.admin.listUsers();
      userId = list?.users.find((x) => x.email === u.email)?.id ?? null;
    }

    if (userId) {
      // Ensure profile reflects membership status
      await supabase
        .from("profiles")
        .update({
          is_wbmc_member: u.is_wbmc_member,
          membership_status: u.is_wbmc_member ? "approved" : "none",
          first_name: u.first_name,
          last_name: u.last_name,
          full_name,
        })
        .eq("user_id", userId);

      if (u.is_wbmc_member) {
        await supabase
          .from("user_roles")
          .upsert(
            { user_id: userId, role: "church_member" },
            { onConflict: "user_id,role" },
          );
      }
    }

    results.push({
      email: u.email,
      password: u.password,
      user_id: userId,
      role: u.is_wbmc_member ? "church_member" : "general_user",
      error: error?.message ?? null,
    });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
