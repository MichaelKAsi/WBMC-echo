import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MarketplaceItem } from "@/types/marketplace";

export function useMarketplaceItems() {
  return useQuery({
    queryKey: ["marketplace_items"],
    queryFn: async (): Promise<MarketplaceItem[]> => {
      const { data, error } = await supabase
        .from("marketplace_items")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: Number(item.price),
        category: item.category as 'services' | 'products',
        subcategory: item.subcategory,
        imageUrl: item.image_url,
        contactInfo: item.contact_info,
        createdAt: item.created_at,
        userId: item.user_id,
      }));
    },
  });
}

export function useAddMarketplaceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<MarketplaceItem, "id" | "createdAt">) => {
      const { error } = await supabase.from("marketplace_items").insert({
        title: item.title,
        description: item.description,
        price: item.price,
        category: item.category,
        subcategory: item.subcategory,
        image_url: item.imageUrl,
        contact_info: item.contactInfo,
        user_id: item.userId,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace_items"] });
    },
  });
}

export function useUpdateMarketplaceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...item }: { id: string } & Partial<Omit<MarketplaceItem, "id" | "createdAt">>) => {
      const { error } = await supabase
        .from("marketplace_items")
        .update({
          title: item.title,
          description: item.description,
          price: item.price,
          category: item.category,
          subcategory: item.subcategory,
          image_url: item.imageUrl,
          contact_info: item.contactInfo,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace_items"] });
    },
  });
}

export function useDeleteMarketplaceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketplace_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace_items"] });
    },
  });
}
