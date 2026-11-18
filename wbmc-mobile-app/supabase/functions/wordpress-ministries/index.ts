import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface Ministry {
  name: string;
  description: string;
  imageUrl: string;
}

const SOURCE_URL = "https://wordbmc.co.za/ministries/";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&#8220;/g, "\u201C")
    .replace(/&#8221;/g, "\u201D")
    .replace(/&#8211;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

function parseMinistries(html: string): Ministry[] {
  const results: Ministry[] = [];
  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2[^>]*>|<\/main>|<footer)/gi;
  let m: RegExpExecArray | null;
  while ((m = h2Regex.exec(html)) !== null) {
    const name = stripTags(m[1]);
    const block = m[2];
    if (!name || /ministries\s*\/\s*departments/i.test(name) || /join us/i.test(name) || /newsletter/i.test(name)) continue;

    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let pm: RegExpExecArray | null;
    while ((pm = pRegex.exec(block)) !== null) {
      const text = stripTags(pm[1]);
      if (text) paragraphs.push(text);
    }
    const description = paragraphs.join(" ").trim();

    const imgMatch = block.match(/<img[^>]+src=["']([^"']+)["']/i);
    const imageUrl = imgMatch ? decodeEntities(imgMatch[1]).replace(/&#\d+;/g, "") : "";

    if (description || imageUrl) {
      results.push({ name, description, imageUrl });
    }
  }
  return results;
}

async function fetchAndCache(): Promise<Ministry[]> {
  const res = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "Mozilla/5.0 EchoApp/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Source responded ${res.status}`);
  const html = await res.text();
  const ministries = parseMinistries(html);

  if (ministries.length > 0) {
    await supabase.from("ministries_cache").upsert({
      id: "wbmc",
      data: ministries,
      fetched_at: new Date().toISOString(),
    });
  }
  return ministries;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const url = new URL(req.url);
  const forceRefresh = url.searchParams.get("refresh") === "1";

  try {
    // Try cache
    const { data: cached } = await supabase
      .from("ministries_cache")
      .select("data, fetched_at")
      .eq("id", "wbmc")
      .maybeSingle();

    const isStale = !cached || (Date.now() - new Date(cached.fetched_at).getTime() > CACHE_TTL_MS);

    if (cached && !forceRefresh && !isStale) {
      return new Response(
        JSON.stringify({ ministries: cached.data, fetchedAt: cached.fetched_at, source: "cache" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" } },
      );
    }

    // Refresh — but fall back to stale cache if scrape fails
    try {
      const fresh = await fetchAndCache();
      return new Response(
        JSON.stringify({ ministries: fresh, fetchedAt: new Date().toISOString(), source: "live" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" } },
      );
    } catch (scrapeErr) {
      console.error("scrape failed, serving stale cache:", scrapeErr);
      if (cached) {
        return new Response(
          JSON.stringify({ ministries: cached.data, fetchedAt: cached.fetched_at, source: "stale" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw scrapeErr;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("wordpress-ministries error:", message);
    return new Response(JSON.stringify({ error: message, ministries: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
