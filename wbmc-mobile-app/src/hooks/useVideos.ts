import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VideoEntry } from "@/types/video";

export function useVideos() {
  return useQuery({
    queryKey: ["videos"],
    queryFn: async (): Promise<VideoEntry[]> => {
      const { data, error } = await supabase.functions.invoke("youtube-videos", {
        body: null,
        method: "GET",
      });

      if (error) throw error;

      return (data.videos || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        youtubeUrl: row.youtube_url,
        thumbnailUrl: row.thumbnail_url,
        createdAt: new Date(row.created_at),
      }));
    },
    staleTime: 30 * 60 * 1000, // 30 min — videos table is the source of truth, refreshed by cron
    gcTime: 60 * 60 * 1000,
    retry: 2,
  });
}
