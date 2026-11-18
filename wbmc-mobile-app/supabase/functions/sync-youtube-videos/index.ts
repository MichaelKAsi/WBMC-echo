import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CHANNEL_ID = "UCt4xr8ppZjd0OTGqrpt0ySA";
// Channel uploads playlist = channel ID with 'UC' replaced by 'UU'
const UPLOADS_PLAYLIST_ID = "UU" + CHANNEL_ID.slice(2);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "YouTube API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const url = new URL(req.url);
    const maxResults = url.searchParams.get("maxResults") || "25";

    // playlistItems.list costs 1 quota unit (vs 100 for search.list)
    const apiUrl =
      `https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}` +
      `&playlistId=${UPLOADS_PLAYLIST_ID}&part=snippet,contentDetails&maxResults=${maxResults}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error("YouTube API error:", data);
      return new Response(
        JSON.stringify({ error: data.error?.message || "YouTube API error" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const candidates = (data.items || [])
      .filter((item: any) => item.contentDetails?.videoId);

    // Only keep videos that are PUBLIC on YouTube.
    // playlistItems includes unlisted/private uploads, so check each video's status.
    const videoIds = candidates.map((item: any) => item.contentDetails.videoId);
    let publicIds = new Set<string>();
    if (videoIds.length > 0) {
      const statusUrl =
        `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}` +
        `&id=${videoIds.join(",")}&part=status&maxResults=50`;
      const statusRes = await fetch(statusUrl);
      const statusData = await statusRes.json();
      if (statusRes.ok) {
        publicIds = new Set(
          (statusData.items || [])
            .filter((v: any) => v.status?.privacyStatus === "public")
            .map((v: any) => v.id),
        );
      } else {
        console.error("YouTube status check error:", statusData);
      }
    }

    const rows = candidates
      // Exclude live streams and scheduled premieres (liveBroadcastContent: "live" | "upcoming")
      .filter((item: any) => (item.snippet.liveBroadcastContent || "none") === "none")
      // Exclude unlisted/private videos
      .filter((item: any) => publicIds.has(item.contentDetails.videoId))
      .map((item: any) => {
        const videoId = item.contentDetails.videoId;
        return {
          youtube_video_id: videoId,
          title: item.snippet.title,
          youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail_url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          created_at: item.contentDetails.videoPublishedAt || item.snippet.publishedAt,
          source: "youtube",
          status: "approved",
        };
      });

    if (rows.length === 0) {
      return new Response(JSON.stringify({ synced: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase
      .from("videos")
      .upsert(rows, { onConflict: "youtube_video_id" });

    if (error) {
      console.error("Upsert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Synced ${rows.length} videos from YouTube uploads playlist`);
    return new Response(
      JSON.stringify({ synced: rows.length, syncedAt: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
