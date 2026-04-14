"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  MB178_ADMIN_STORE_KEY,
  appendStoreScope,
} from "@/lib/mb178/owner-scope";
import type { Mb178StoreRow } from "@/lib/mb178/types";
import { useAuth } from "@/components/providers/auth-provider";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}

interface OwnerStoreScopeValue {
  /** Toko yang dipakai untuk query owner API (owner: dari sesi; admin: pilihan). */
  effectiveStoreId: string | null;
  /** Label singkat toko aktif (untuk banner UI). */
  activeStoreLabel: string | null;
  /** Siap memanggil API yang membutuhkan store_id (termasuk admin setelah daftar toko dimuat). */
  ready: boolean;
  appendApiUrl: (path: string) => string;
  superAdminStores: Mb178StoreRow[];
  setSuperAdminStoreId: (id: string) => void;
  storesLoadError: string | null;
}

const OwnerStoreScopeContext = createContext<OwnerStoreScopeValue | null>(
  null
);

export function useOwnerStoreScope(): OwnerStoreScopeValue {
  const ctx = useContext(OwnerStoreScopeContext);
  if (!ctx) {
    throw new Error(
      "useOwnerStoreScope harus dipakai di dalam OwnerStoreScopeProvider"
    );
  }
  return ctx;
}

export function OwnerStoreScopeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isOwner, isSuperAdmin } = useAuth();
  const [superAdminStores, setSuperAdminStores] = useState<Mb178StoreRow[]>(
    []
  );
  const [adminStoreId, setAdminStoreId] = useState<string | null>(null);
  const [storesLoaded, setStoresLoaded] = useState(false);
  const [storesLoadError, setStoresLoadError] = useState<string | null>(null);

  const [ownerStoreId, setOwnerStoreId] = useState<string | null>(null);
  const [activeStoreLabel, setActiveStoreLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function resolveOwnerStoreId() {
      if (loading || !user || !isOwner || isSuperAdmin) {
        setOwnerStoreId(null);
        return;
      }
      const supabase = getSupabase();
      if (!supabase) {
        setOwnerStoreId(null);
        return;
      }
      const { data, error } = await supabase
        .from("store_memberships")
        .select("store_id")
        .eq("role", "owner")
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data?.store_id) {
        setOwnerStoreId(null);
        return;
      }
      setOwnerStoreId(data.store_id);
    }
    void resolveOwnerStoreId();
    return () => {
      cancelled = true;
    };
  }, [loading, user, isOwner, isSuperAdmin]);

  useEffect(() => {
    if (loading || !user) return;
    if (!isSuperAdmin) {
      return;
    }

    let cancelled = false;
    (async () => {
      setStoresLoaded(false);
      setStoresLoadError(null);
      try {
        const res = await fetch("/api/owner/stores");
        const json = (await res.json()) as {
          stores?: Mb178StoreRow[];
          error?: string;
          hint?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setSuperAdminStores([]);
          setStoresLoadError(
            [json.error, json.hint].filter(Boolean).join(" — ") ||
            "Gagal memuat daftar toko"
          );
          setStoresLoaded(true);
          return;
        }
        const list = json.stores ?? [];
        setSuperAdminStores(list);

        const saved =
          typeof window !== "undefined"
            ? window.localStorage.getItem(MB178_ADMIN_STORE_KEY)
            : null;
        const valid = saved && list.some((s) => s.id === saved);
        if (valid) {
          setAdminStoreId(saved);
        } else if (list[0]) {
          setAdminStoreId(list[0].id);
        } else {
          setAdminStoreId(null);
        }
        setStoresLoaded(true);
      } catch {
        if (!cancelled) {
          setStoresLoadError("Gagal memuat daftar toko");
          setStoresLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user, isSuperAdmin]);

  useEffect(() => {
    if (
      isSuperAdmin &&
      adminStoreId &&
      typeof window !== "undefined"
    ) {
      window.localStorage.setItem(MB178_ADMIN_STORE_KEY, adminStoreId);
    }
  }, [isSuperAdmin, adminStoreId]);

  const effectiveStoreId =
    !loading && isOwner && !isSuperAdmin
      ? ownerStoreId
      : !loading && isSuperAdmin
        ? adminStoreId
        : null;

  const ready = useMemo(() => {
    if (loading || !user) return false;
    if (isOwner && !isSuperAdmin) return !!ownerStoreId;
    if (isSuperAdmin) return storesLoaded;
    return false;
  }, [loading, user, isOwner, isSuperAdmin, ownerStoreId, storesLoaded]);

  const appendApiUrl = useCallback(
    (path: string) => appendStoreScope(path, effectiveStoreId),
    [effectiveStoreId]
  );

  useEffect(() => {
    let cancelled = false;
    const sid = effectiveStoreId?.trim() ?? "";
    void (async () => {
      if (!ready || !sid) {
        if (!cancelled) setActiveStoreLabel(null);
        return;
      }
      if (isSuperAdmin) {
        const row = superAdminStores.find((s) => s.id === sid);
        if (!cancelled) {
          setActiveStoreLabel(
            row ? `${row.name} · /store/${row.slug}` : null
          );
        }
        return;
      }
      const url = appendStoreScope("/api/owner/store", sid);
      try {
        const res = await fetch(url, { credentials: "same-origin" });
        const json = (await res.json()) as { store?: Mb178StoreRow | null };
        if (cancelled) return;
        const s = json.store;
        setActiveStoreLabel(
          s ? `${s.name} · /store/${s.slug}` : null
        );
      } catch {
        if (!cancelled) setActiveStoreLabel(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, effectiveStoreId, isSuperAdmin, superAdminStores]);

  const value = useMemo<OwnerStoreScopeValue>(
    () => ({
      effectiveStoreId,
      activeStoreLabel,
      ready:
        ready &&
        (!isSuperAdmin || !!effectiveStoreId || superAdminStores.length === 0),
      appendApiUrl,
      superAdminStores,
      setSuperAdminStoreId: setAdminStoreId,
      storesLoadError,
    }),
    [
      effectiveStoreId,
      activeStoreLabel,
      ready,
      isSuperAdmin,
      appendApiUrl,
      superAdminStores,
      storesLoadError,
    ]
  );

  return (
    <OwnerStoreScopeContext.Provider value={value}>
      {children}
    </OwnerStoreScopeContext.Provider>
  );
}

export function SuperAdminStorePicker() {
  const { loading, user, isSuperAdmin } = useAuth();
  const {
    superAdminStores,
    setSuperAdminStoreId,
    effectiveStoreId,
    storesLoadError,
    ready,
  } = useOwnerStoreScope();

  if (loading || !user || !isSuperAdmin) {
    return null;
  }

  return (
    <div className="mt-3 rounded-2xl border border-amber-500/25 bg-zinc-900/60 px-3 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-amber-200/80">
        Master admin — kelola toko
      </p>
      {storesLoadError ? (
        <p className="mt-2 text-xs text-red-300/90">{storesLoadError}</p>
      ) : null}
      {!ready ? (
        <p className="mt-2 text-xs text-zinc-500">Memuat daftar toko…</p>
      ) : superAdminStores.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-500">
          Belum ada toko di database. Jalankan{" "}
          <code className="text-zinc-400">supabase/setup-complete.sql</code>.
        </p>
      ) : (
        <label className="mt-2 block">
          <span className="sr-only">Pilih toko</span>
          <select
            className="mt-1 w-full rounded-xl border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50"
            value={effectiveStoreId ?? ""}
            onChange={(e) => setSuperAdminStoreId(e.target.value)}
          >
            {superAdminStores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.slug})
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
