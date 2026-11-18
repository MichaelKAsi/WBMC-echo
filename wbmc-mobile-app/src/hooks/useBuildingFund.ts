import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BuildingFund {
  id: string;
  currentAmount: number;
  goalAmount: number;
  updatedAt: string;
}

export function useBuildingFund() {
  return useQuery({
    queryKey: ["building_fund"],
    staleTime: 0,
    queryFn: async (): Promise<BuildingFund> => {
      const { data, error } = await supabase
        .from("building_fund")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        currentAmount: Number(data.current_amount),
        goalAmount: Number(data.goal_amount),
        updatedAt: data.updated_at,
      };
    },
  });
}

export function useUpdateBuildingFund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, currentAmount, goalAmount }: { id: string; currentAmount: number; goalAmount: number }) => {
      const { error } = await supabase
        .from("building_fund")
        .update({
          current_amount: currentAmount,
          goal_amount: goalAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["building_fund"] });
    },
  });
}
