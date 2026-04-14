"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MB178_SCHEMA } from "@/lib/mb178/constants";

interface AuthContextValue {
  user: User | null;
  isOwner: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !anonKey?.trim()) return null;
  return createBrowserClient(url, anonKey, { db: { schema: MB178_SCHEMA } });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function init() {
      if (!supabase) {
        if (mounted) {
          setUser(null);
          setIsOwner(false);
          setIsSuperAdmin(false);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (mounted) {
        setUser(data.user ?? null);
        setLoading(false);
      }
    }
    void init();

    if (!supabase) return () => { };
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    async function refreshRoles() {
      if (!supabase || !user) {
        setIsOwner(false);
        setIsSuperAdmin(false);
        return;
      }
      const { data, error } = await supabase
        .from("store_memberships")
        .select("role")
        .in("role", ["owner", "super_admin"]);
      if (cancelled) return;
      if (error) {
        setIsOwner(false);
        setIsSuperAdmin(false);
        return;
      }
      const roles = (data ?? []).map((r) => r.role);
      setIsSuperAdmin(roles.includes("super_admin"));
      setIsOwner(roles.includes("owner") || roles.includes("super_admin"));
    }
    void refreshRoles();
    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      isOwner,
      isSuperAdmin,
      loading,
      signOut: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
      },
    }),
    [supabase, user, isOwner, isSuperAdmin, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
