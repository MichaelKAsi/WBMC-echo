import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Hymn {
  id: string;
  hymn_number: number;
  title: string;
  lyrics: string;
  created_at: string;
}

export function useHymns(searchQuery: string = "") {
  return useQuery({
    queryKey: ["hymns", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("hymns")
        .select("*")
        .order("hymn_number", { ascending: true });

      if (searchQuery.trim()) {
        const term = searchQuery.trim();
        const numericTerm = parseInt(term);
        
        if (!isNaN(numericTerm)) {
          // Search by number or text
          query = query.or(
            `hymn_number.eq.${numericTerm},title.ilike.%${term}%,lyrics.ilike.%${term}%`
          );
        } else {
          query = query.or(
            `title.ilike.%${term}%,lyrics.ilike.%${term}%`
          );
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Hymn[];
    },
  });
}
