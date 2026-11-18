import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "announcement" | "reminder";
  sort_order: number;
  is_featured: boolean;
  image_url: string | null;
  created_at: string;
  scheduled_at: string | null;
}

export function useAnnouncements() {
  return useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("status", "approved")
        .or(`scheduled_at.is.null,scheduled_at.lte.${nowIso}`)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Announcement[];
    },
  });
}

export function useAnnouncementsAdmin() {
  return useQuery<Announcement[]>({
    queryKey: ["announcements", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Announcement[];
    },
  });
}

export function useFeaturedAnnouncements() {
  return useQuery<Announcement[]>({
    queryKey: ["announcements", "featured"],
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_featured", true)
        .eq("status", "approved")
        .or(`scheduled_at.is.null,scheduled_at.lte.${nowIso}`)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as unknown as Announcement[];
    },
  });
}

export function useAddAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: { title: string; content: string; type: string; sort_order: number; is_featured: boolean; image_url?: string | null; status?: string; submitted_by?: string; scheduled_at?: string | null }) => {
      const { error } = await supabase.from("announcements").insert(item);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; content?: string; type?: string; sort_order?: number; is_featured?: boolean; image_url?: string | null; scheduled_at?: string | null }) => {
      const { error } = await supabase.from("announcements").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}
