import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BIBLE_ID = "78a9f6124f344018-01";
const API_BASE = "https://rest.api.bible/v1";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("API_BIBLE_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint");

    if (!endpoint) {
      return new Response(JSON.stringify({ error: "Missing endpoint parameter" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // CACHE LAYER: chapter content endpoint -> "chapters/{chapterId}"
    const chapterMatch = endpoint.match(/^chapters\/([^/]+)$/);
    if (chapterMatch) {
      const chapterId = chapterMatch[1];

      // Try cache first
      const { data: cached } = await supabase
        .from("bible_chapter_cache")
        .select("chapter_id, reference, content")
        .eq("chapter_id", chapterId)
        .maybeSingle();

      if (cached) {
        return new Response(
          JSON.stringify({ data: { id: cached.chapter_id, reference: cached.reference, content: cached.content } }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Miss -> fetch from API.Bible, then store
      const forwardParams = new URLSearchParams();
      url.searchParams.forEach((value, key) => {
        if (key !== "endpoint") forwardParams.set(key, value);
      });
      const apiUrl = `${API_BASE}/bibles/${BIBLE_ID}/${endpoint}${forwardParams.toString() ? `?${forwardParams}` : ''}`;

      const response = await fetch(apiUrl, {
        headers: { 'accept': 'application/json', 'api-key': apiKey },
      });
      const json = await response.json();

      if (response.ok && json?.data?.content) {
        await supabase.from("bible_chapter_cache").upsert({
          chapter_id: chapterId,
          reference: json.data.reference ?? chapterId,
          content: json.data.content,
          fetched_at: new Date().toISOString(),
        });
      }

      return new Response(JSON.stringify(json), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default passthrough (books, chapters list, etc.)
    let apiUrl = `${API_BASE}/bibles/${BIBLE_ID}/${endpoint}`;
    const forwardParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      if (key !== "endpoint") forwardParams.set(key, value);
    });
    const paramString = forwardParams.toString();
    if (paramString) apiUrl += `?${paramString}`;

    const response = await fetch(apiUrl, {
      headers: { 'accept': 'application/json', 'api-key': apiKey },
    });
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
