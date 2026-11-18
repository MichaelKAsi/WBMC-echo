import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BibleHighlight {
  id: string;
  user_id: string;
  chapter_id: string;
  chapter_reference: string;
  book_name: string;
  selected_text: string;
  color: string;
  start_offset: number;
  end_offset: number;
  created_at: string;
}

export function useBibleHighlights(userId: string | null, chapterId: string | null) {
  return useQuery<BibleHighlight[]>({
    queryKey: ["bible-highlights", userId, chapterId],
    queryFn: async () => {
      if (!userId || !chapterId) return [];
      const { data, error } = await supabase
        .from("bible_highlights")
        .select("*")
        .eq("user_id", userId)
        .eq("chapter_id", chapterId)
        .order("start_offset", { ascending: true });
      if (error) throw error;
      return (data as BibleHighlight[]) || [];
    },
    enabled: !!userId && !!chapterId,
  });
}

export function useAddHighlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (h: Omit<BibleHighlight, "id" | "created_at">) => {
      const { data, error } = await supabase.from("bible_highlights").insert(h).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["bible-highlights", vars.user_id, vars.chapter_id] });
    },
  });
}

export function useDeleteHighlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; userId: string; chapterId: string }) => {
      const { error } = await supabase.from("bible_highlights").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["bible-highlights", vars.userId, vars.chapterId] });
    },
  });
}
