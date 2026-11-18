import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { fileBase64, minHymn, maxHymn, clearExisting } = await req.json();
    
    if (!fileBase64) {
      return new Response(JSON.stringify({ error: "No fileBase64 provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64 to Uint8Array
    const binaryString = atob(fileBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const workbook = XLSX.read(bytes, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    console.log(`Found ${rows.length} rows in spreadsheet`);
    console.log("Column headers:", Object.keys(rows[0] || {}));

    if (clearExisting) {
      // Delete only hymns in the specified range
      if (minHymn && maxHymn) {
        const { error: deleteError } = await supabase.from("hymns").delete().gte("hymn_number", minHymn).lte("hymn_number", maxHymn);
        if (deleteError) console.error("Delete error:", deleteError);
        console.log(`Cleared hymns ${minHymn}-${maxHymn}`);
      } else {
        const { error: deleteError } = await supabase.from("hymns").delete().gte("hymn_number", 0);
        if (deleteError) console.error("Delete error:", deleteError);
        console.log("Cleared all existing hymns");
      }
    }

    // Log all column headers to understand structure
    const headers = Object.keys(rows[0] || {});
    console.log("All headers:", JSON.stringify(headers));
    if (rows[0]) {
      console.log("Sample row:", JSON.stringify(rows[0]).substring(0, 500));
    }

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: "No rows found in spreadsheet" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map rows - try multiple possible column name patterns
    const hymns = rows.map((row, index) => {
      const number = row["Hymn Number"] || row["Number"] || row["hymn_number"] || (index + 1);
      const title = row["Title"] || row["Hymn Title"] || row["title"] || `Sefela ${number}`;
      const author = row["Author"] || row["author"] || row["Hymn Author"] || "";
      const lyrics = row["Lyrics"] || row["Hymn Content"] || row["lyrics"] || row["Content"] || "";
      
      const hymnNum = typeof number === "string" ? parseInt(number) || (index + 1) : number;
      const lyricsStr = String(lyrics).trim();
      const titleStr = String(title).trim();
      const authorStr = String(author).trim();
      
      // Prepend title as first line, then lyrics, then author at bottom
      const lyricsWithTitle = `${titleStr}\n${lyricsStr}`;
      const fullLyrics = authorStr 
        ? `${lyricsWithTitle}\n\n— ${authorStr}`
        : lyricsWithTitle;
      
      return {
        hymn_number: hymnNum,
        title: titleStr || `Sefela ${number}`,
        lyrics: fullLyrics,
      };
    }).filter(h => {
      if (!h.lyrics || h.lyrics === `— `) return false;
      // Filter by range if specified
      if (minHymn && h.hymn_number < minHymn) return false;
      if (maxHymn && h.hymn_number > maxHymn) return false;
      return true;
    });

    console.log(`Mapped ${hymns.length} valid hymns`);
    if (hymns.length > 0) {
      console.log("Sample:", JSON.stringify(hymns[0]).substring(0, 300));
    }

    // Insert in batches of 50
    const batchSize = 50;
    let inserted = 0;
    for (let i = 0; i < hymns.length; i += batchSize) {
      const batch = hymns.slice(i, i + batchSize);
      const { error } = await supabase.from("hymns").insert(batch);
      if (error) {
        console.error(`Batch insert error at ${i}:`, error);
        return new Response(JSON.stringify({ error: error.message, batch: i, inserted }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      inserted += batch.length;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      total_rows: rows.length,
      inserted,
      sample: hymns.slice(0, 3).map(h => ({ ...h, lyrics: h.lyrics.substring(0, 100) })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
