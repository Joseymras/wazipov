import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "super_admin" | "admin" | "user";

export function useRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setRoles([]); setLoading(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      setRoles((data || []).map((r: any) => r.role as AppRole));
      setLoading(false);
    });
  }, [user]);

  return {
    roles,
    loading,
    isSuperAdmin: roles.includes("super_admin"),
    isAdmin: roles.includes("admin") || roles.includes("super_admin"),
  };
}
