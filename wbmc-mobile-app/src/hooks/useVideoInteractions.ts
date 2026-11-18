import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    supabase.auth.getSession().then(({ data: { session } }) =>
      setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  return user;
}

// --- Likes ---

export function useVideoLikes(videoId: string) {
  return useQuery({
    queryKey: ["video-likes", videoId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_video_like_count", { _video_id: videoId });
      if (error) throw error;
      return data ?? 0;
    },
  });
}

export function useUserLiked(videoId: string, userId: string | undefined) {
  return useQuery({
    queryKey: ["video-liked", videoId, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_likes")
        .select("id")
        .eq("video_id", videoId)
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

export function useToggleLike(videoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, liked }: { userId: string; liked: boolean }) => {
      if (liked) {
        await supabase.from("video_likes").delete().eq("video_id", videoId).eq("user_id", userId);
      } else {
        await supabase.from("video_likes").insert({ video_id: videoId, user_id: userId });
      }
    },
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ["video-likes", videoId] });
      qc.invalidateQueries({ queryKey: ["video-liked", videoId, userId] });
    },
  });
}

// --- Comments ---

export interface VideoComment {
  id: string;
  content: string;
  user_name: string | null;
  created_at: string;
  user_id: string;
}

export function useVideoComments(videoId: string) {
  return useQuery({
    queryKey: ["video-comments", videoId],
    queryFn: async (): Promise<VideoComment[]> => {
      const { data, error } = await supabase
        .rpc("get_video_comments", { _video_id: videoId });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddComment(videoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, content, userName }: { userId: string; content: string; userName?: string }) => {
      const { error } = await supabase
        .from("video_comments")
        .insert({ video_id: videoId, user_id: userId, content, user_name: userName ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["video-comments", videoId] });
    },
  });
}
