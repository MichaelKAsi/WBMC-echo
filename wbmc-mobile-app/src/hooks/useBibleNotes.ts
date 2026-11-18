import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BibleNote {
  id: string;
  user_id: string;
  book_name: string;
  chapter_reference: string;
  chapter_id: string;
  content: string;
  reminder_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface BibleBookmark {
  id: string;
  user_id: string;
  book_name: string;
  chapter_reference: string;
  chapter_id: string;
  label: string | null;
  reminder_date: string | null;
  created_at: string;
}

export function useBibleNotes(userId: string | undefined) {
  return useQuery<BibleNote[]>({
    queryKey: ["bible-notes", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bible_notes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BibleNote[];
    },
    enabled: !!userId,
  });
}

export function useBibleBookmarks(userId: string | undefined) {
  return useQuery<BibleBookmark[]>({
    queryKey: ["bible-bookmarks", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bible_bookmarks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BibleBookmark[];
    },
    enabled: !!userId,
  });
}

export function useAddBibleNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: { user_id: string; book_name: string; chapter_reference: string; chapter_id: string; content: string; reminder_date?: string | null }) => {
      const { error } = await supabase.from("bible_notes").insert(note);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bible-notes"] }),
  });
}

export function useUpdateBibleNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; content?: string; reminder_date?: string | null }) => {
      const { error } = await supabase.from("bible_notes").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bible-notes"] }),
  });
}

export function useDeleteBibleNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bible_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bible-notes"] }),
  });
}

export function useAddBibleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookmark: { user_id: string; book_name: string; chapter_reference: string; chapter_id: string; label?: string | null; reminder_date?: string | null }) => {
      const { error } = await supabase.from("bible_bookmarks").insert(bookmark);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bible-bookmarks"] }),
  });
}

export function useUpdateBibleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; label?: string | null; reminder_date?: string | null }) => {
      const { error } = await supabase.from("bible_bookmarks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bible-bookmarks"] }),
  });
}

export function useDeleteBibleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bible_bookmarks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bible-bookmarks"] }),
  });
}
