"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Mb178OrderRow } from "@/lib/mb178/types";
import { useOwnerStoreScope } from "@/components/owner/owner-store-scope";
import { useAuth } from "@/components/providers/auth-provider";

type OrderRow = Mb178OrderRow;

const STATUS_OPTIONS = [
  "pending",
  "pending_payment",
  "pending_cod",
  "booked",
  "paid",
  "shipped",
  "completed",
  "cancelled",
] as const;

const STATUS_STYLE: Record<string, string> = {
  pending: "border-amber-500/40 text-amber-300",
  pending_payment: "border-amber-500/40 text-amber-300",
  pending_cod: "border-amber-500/40 text-amber-300",
  booked: "border-blue-500/40 text-blue-300",
  paid: "border-emerald-500/40 text-emerald-300",
  shipped: "border-sky-500/40 text-sky-300",
  completed: "border-emerald-500/40 text-emerald-200",
  cancelled: "border-red-500/40 text-red-300",
};

function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OwnerOrdersPage() {
  const { user, loading: authLoading, isOwner } = useAuth();
  const { appendApiUrl, ready: storeReady } = useOwnerStoreScope();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(appendApiUrl("/api/owner/orders"));
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal memuat pesanan");
        return;
      }
      setOrders(json.orders ?? []);
    } catch {
      setError("Gagal memuat pesanan");
    } finally {
      setLoading(false);
    }
  }, [appendApiUrl]);

  useEffect(() => {
    if (!authLoading && user && isOwner && storeReady) void fetchOrders();
  }, [authLoading, user, isOwner, storeReady, fetchOrders]);

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    setError(null);
    try {
      const res = await fetch(appendApiUrl(`/api/owner/orders/${orderId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal mengubah status");
        return;
      }
      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        )
      );
    } catch {
      setError("Gagal mengubah status");
    } finally {
      setUpdatingId(null);
    }
  }

  if (authLoading) {
    return (
      <div className="px-4 py-16 text-center text-sm text-zinc-500">
        Memuat…
      </div>
    );
  }

  if (!user || !isOwner) return null;

  if (!storeReady) {
    return (
      <div className="px-4 py-16 text-center text-sm text-zinc-500">
        Memuat konteks toko…
      </div>
    );
  }

  return (
    <div className="px-4 pb-28 pt-4 md:mx-auto md:max-w-lg">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm text-amber-500/90 underline-offset-4 hover:underline"
        >
          ← Dashboard
        </Link>
        <button
          type="button"
          onClick={() => void fetchOrders()}
          disabled={loading}
          className="text-xs text-zinc-400 hover:text-amber-400 disabled:opacity-50"
        >
          ↻ Refresh
        </button>
      </div>

      <h1 className="font-serif text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 md:text-3xl">
        Kelola Pesanan
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Pesanan dari pelanggan toko Anda. Ubah status sesuai proses.
      </p>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200/90">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-8 text-center text-sm text-zinc-500">
          Memuat pesanan…
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-700 py-12 text-center text-sm text-zinc-500">
          Belum ada pesanan masuk untuk toko ini.
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((o) => {
            const statusCls =
              STATUS_STYLE[o.status] ?? "border-zinc-600 text-zinc-400";
            return (
              <li
                key={o.id}
                className="rounded-2xl border border-yellow-600/10 bg-zinc-900/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-zinc-500">
                      {formatDate(o.created_at)}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-amber-200/90">
                      {formatRp(Number(o.total))}
                    </p>
                    {o.customer_name ? (
                      <p className="mt-1 text-sm text-zinc-300">
                        {o.customer_name}
                        {o.customer_phone ? (
                          <span className="ml-2 text-zinc-500">
                            {o.customer_phone}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                    {o.notes ? (
                      <p className="mt-1 text-xs text-zinc-500 italic">
                        &ldquo;{o.notes}&rdquo;
                      </p>
                    ) : null}
                    <p className="mt-2 text-[11px] text-zinc-600">
                      {o.channel} · {o.payment_method}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg border px-2 py-1 text-xs font-medium ${statusCls}`}
                  >
                    {o.status}
                  </span>
                </div>

                <div className="mt-3 border-t border-zinc-800 pt-3">
                  <label className="block">
                    <span className="text-[11px] text-zinc-500">
                      Ubah status:
                    </span>
                    <select
                      className="mt-1 w-full rounded-xl border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50 disabled:opacity-50"
                      value={o.status}
                      disabled={updatingId === o.id}
                      onChange={(e) =>
                        void updateStatus(o.id, e.target.value)
                      }
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
