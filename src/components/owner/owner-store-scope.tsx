"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import {
  MB178_ADMIN_STORE_KEY,
  appendStoreScope,
} from "@/lib/mb178/owner-scope";
import type { Mb178StoreRow } from "@/lib/mb178/types";

interface OwnerStoreScopeValue {
  /** Toko yang dipakai untuk query owner API (owner: dari sesi; admin: pilihan). */
  effectiveStoreId: string | null;
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
  const { data: session, status } = useSession();
  const [superAdminStores, setSuperAdminStores] = useState<Mb178StoreRow[]>(
    []
  );
  const [adminStoreId, setAdminStoreId] = useState<string | null>(null);
  const [storesLoaded, setStoresLoaded] = useState(false);
  const [storesLoadError, setStoresLoadError] = useState<string | null>(null);

  const role = session?.user?.role;
  const ownerStoreId = session?.user?.storeId ?? null;

  useEffect(() => {
    if (status !== "authenticated") return;
    if (role !== "super_admin") {
      setStoresLoaded(true);
      setStoresLoadError(null);
      return;
    }

    let cancelled = false;
    setStoresLoaded(false);
    setStoresLoadError(null);

    (async () => {
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
  }, [status, role]);

  useEffect(() => {
    if (
      role === "super_admin" &&
      adminStoreId &&
      typeof window !== "undefined"
    ) {
      window.localStorage.setItem(MB178_ADMIN_STORE_KEY, adminStoreId);
    }
  }, [role, adminStoreId]);

  const effectiveStoreId =
    role === "owner"
      ? ownerStoreId
      : role === "super_admin"
        ? adminStoreId
        : null;

  const ready = useMemo(() => {
    if (status !== "authenticated") return false;
    if (role === "owner") return !!ownerStoreId;
    if (role === "super_admin") return storesLoaded;
    return false;
  }, [status, role, ownerStoreId, storesLoaded]);

  const appendApiUrl = useCallback(
    (path: string) => appendStoreScope(path, effectiveStoreId),
    [effectiveStoreId]
  );

  const value = useMemo<OwnerStoreScopeValue>(
    () => ({
      effectiveStoreId,
      ready: ready && (role !== "super_admin" || !!effectiveStoreId || superAdminStores.length === 0),
      appendApiUrl,
      superAdminStores,
      setSuperAdminStoreId: setAdminStoreId,
      storesLoadError,
    }),
    [
      effectiveStoreId,
      ready,
      role,
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
  const { data: session, status } = useSession();
  const {
    superAdminStores,
    setSuperAdminStoreId,
    effectiveStoreId,
    storesLoadError,
    ready,
  } = useOwnerStoreScope();

  if (status !== "authenticated" || session?.user?.role !== "super_admin") {
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
