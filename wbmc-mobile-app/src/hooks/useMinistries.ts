import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Ministry {
  name: string;
  description: string;
  imageUrl: string;
}

export function useMinistries() {
  return useQuery({
    queryKey: ["ministries"],
    queryFn: async (): Promise<Ministry[]> => {
      const { data, error } = await supabase.functions.invoke("wordpress-ministries", {
        method: "GET",
      });
      if (error) throw error;
      return (data?.ministries ?? []) as Ministry[];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 2,
    // Keep showing last-known data on refetch errors
    placeholderData: (prev) => prev,
  });
}
