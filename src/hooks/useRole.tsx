import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "super_admin" | "admin" | "user";

export function useRole() {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setRoles([]); setLoading(false); return; }
    setLoading(true);
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      setRoles((data || []).map((r: any) => r.role as AppRole));
      setFetchedFor(user.id);
      setLoading(false);
    });
  }, [user, authLoading]);

  return {
    roles,
    loading: loading || authLoading || (!!user && fetchedFor !== user.id),
    isSuperAdmin: roles.includes("super_admin"),
    isAdmin: roles.includes("admin") || roles.includes("super_admin"),
  };
}
