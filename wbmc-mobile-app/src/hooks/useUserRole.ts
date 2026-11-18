import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole =
  | "general_user"
  | "approved_merchant"
  | "manager"
  | "admin"
  | "pastor"
  | "developer"
  | "mentor"
  | "mentee"
  | "church_member"
  | "kids";

interface UserRoleState {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isMerchant: boolean;
  isPastor: boolean;
  isDeveloper: boolean;
  isKids: boolean;
  canAccessAdmin: boolean;
  canAccessPastorAdmin: boolean;
  canAddMarketplaceItem: boolean;
}

export function useUserRole(): UserRoleState {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async (userId: string) => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .limit(1)
        .single();
      setRole((data?.role as AppRole) ?? "general_user");
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          fetchRole(u.id);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchRole(u.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isMerchant = role === "approved_merchant";
  const isPastor = role === "pastor";
  const isDeveloper = role === "developer" || role === "admin";
  const isKids = role === "kids";

  return {
    user,
    role,
    loading,
    isAdmin,
    isManager,
    isMerchant,
    isPastor,
    isDeveloper,
    isKids,
    canAccessAdmin: isAdmin || isManager,
    canAccessPastorAdmin: isPastor || isAdmin,
    canAddMarketplaceItem: isAdmin || isMerchant,
  };
}
