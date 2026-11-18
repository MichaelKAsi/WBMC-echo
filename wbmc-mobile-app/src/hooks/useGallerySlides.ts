import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GallerySlide } from "@/types/gallery";

export function useGallerySlides() {
  return useQuery({
    queryKey: ["gallery_slides"],
    queryFn: async (): Promise<GallerySlide[]> => {
      const { data, error } = await supabase
        .from("gallery_slides")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        images: row.images || [],
        mobileImages: row.mobile_images || [],
        googleDriveLink: row.google_drive_link,
        createdAt: new Date(row.created_at),
      }));
    },
  });
}

export function useAddGallerySlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<GallerySlide, "id" | "createdAt"> & { status?: string; submitted_by?: string }) => {
      const { data, error } = await supabase
        .from("gallery_slides")
        .insert({
          title: entry.title,
          images: entry.images,
          mobile_images: entry.mobileImages || [],
          google_drive_link: entry.googleDriveLink,
          status: entry.status || "approved",
          submitted_by: entry.submitted_by || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery_slides"] });
    },
  });
}

export function useDeleteGallerySlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_slides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery_slides"] });
    },
  });
}
