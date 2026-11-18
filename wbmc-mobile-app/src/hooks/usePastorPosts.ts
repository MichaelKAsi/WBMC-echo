import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PastorPost {
  id: string;
  userId: string;
  content: string;
  mediaUrls: string[];
  mediaType: string;
  createdAt: string;
  updatedAt: string;
  scheduledAt: string | null;
  authorName?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

export interface PastorPostComment {
  id: string;
  userId: string;
  postId: string;
  content: string;
  userName: string | null;
  createdAt: string;
}

export function usePastorPosts() {
  return useQuery({
    queryKey: ["pastor_posts"],
    queryFn: async (): Promise<PastorPost[]> => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("pastor_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const now = new Date();
      const visiblePosts = (data || []).filter((p: any) => {
        if (!p.scheduled_at) return true;
        return new Date(p.scheduled_at) <= now;
      });

      const userIds = [...new Set(visiblePosts.map((p: any) => p.user_id))];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        if (profiles) {
          profiles.forEach((p: any) => { profileMap[p.user_id] = p.full_name || "Pastor"; });
        }
      }

      const postIds = visiblePosts.map((p: any) => p.id);
      let likesMap: Record<string, number> = {};
      let userLikesSet = new Set<string>();
      let commentsMap: Record<string, number> = {};

      if (postIds.length > 0) {
        const { data: likes } = await supabase
          .from("pastor_post_likes")
          .select("post_id, user_id")
          .in("post_id", postIds);
        if (likes) {
          likes.forEach((l: any) => {
            likesMap[l.post_id] = (likesMap[l.post_id] || 0) + 1;
            if (user && l.user_id === user.id) userLikesSet.add(l.post_id);
          });
        }

        const { data: comments } = await supabase
          .from("pastor_post_comments")
          .select("post_id")
          .in("post_id", postIds);
        if (comments) {
          comments.forEach((c: any) => {
            commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1;
          });
        }
      }

      return visiblePosts.map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        content: p.content,
        mediaUrls: p.media_urls || [],
        mediaType: p.media_type || "text",
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        scheduledAt: p.scheduled_at,
        authorName: profileMap[p.user_id] || "Pastor",
        likesCount: likesMap[p.id] || 0,
        commentsCount: commentsMap[p.id] || 0,
        isLiked: userLikesSet.has(p.id),
      }));
    },
  });
}

export function usePastorPostsAdmin() {
  return useQuery({
    queryKey: ["pastor_posts_admin"],
    queryFn: async (): Promise<PastorPost[]> => {
      const { data, error } = await supabase
        .from("pastor_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        content: p.content,
        mediaUrls: p.media_urls || [],
        mediaType: p.media_type || "text",
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        scheduledAt: p.scheduled_at,
        authorName: "Pastor",
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
      }));
    },
  });
}

export function useAddPastorPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: { content: string; mediaUrls: string[]; mediaType: string; userId: string; scheduledAt?: string | null }) => {
      const { error } = await supabase.from("pastor_posts").insert({
        content: post.content,
        media_urls: post.mediaUrls,
        media_type: post.mediaType,
        user_id: post.userId,
        scheduled_at: post.scheduledAt || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pastor_posts"] });
      qc.invalidateQueries({ queryKey: ["pastor_posts_admin"] });
    },
  });
}

export function useUpdatePastorPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: { id: string; content: string; mediaUrls: string[]; mediaType: string; scheduledAt?: string | null }) => {
      const { error } = await supabase.from("pastor_posts").update({
        content: post.content,
        media_urls: post.mediaUrls,
        media_type: post.mediaType,
        scheduled_at: post.scheduledAt || null,
      }).eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pastor_posts"] });
      qc.invalidateQueries({ queryKey: ["pastor_posts_admin"] });
    },
  });
}

export function useDeletePastorPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pastor_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pastor_posts"] });
      qc.invalidateQueries({ queryKey: ["pastor_posts_admin"] });
    },
  });
}

export function useTogglePastorPostLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Must be logged in");

      if (isLiked) {
        await supabase.from("pastor_post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      } else {
        await supabase.from("pastor_post_likes").insert({ post_id: postId, user_id: user.id });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pastor_posts"] }),
  });
}

export function usePastorPostComments(postId: string) {
  return useQuery({
    queryKey: ["pastor_post_comments", postId],
    queryFn: async (): Promise<PastorPostComment[]> => {
      const { data, error } = await supabase
        .from("pastor_post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        postId: c.post_id,
        content: c.content,
        userName: c.user_name,
        createdAt: c.created_at,
      }));
    },
    enabled: !!postId,
  });
}

export function useAddPastorPostComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Must be logged in");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      await supabase.from("pastor_post_comments").insert({
        post_id: postId,
        user_id: user.id,
        content,
        user_name: profile?.full_name || "Member",
      });
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["pastor_post_comments", vars.postId] });
      qc.invalidateQueries({ queryKey: ["pastor_posts"] });
    },
  });
}
