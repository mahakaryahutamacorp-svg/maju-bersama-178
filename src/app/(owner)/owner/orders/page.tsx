"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useOwnerStoreScope } from "@/components/owner/owner-store-scope";
import { labelOrderStatus } from "@/lib/mb178/order-status";
import { formatRp, formatDateId, formatQty } from "@/lib/mb178/format";
import type { Mb178OrderRow, Mb178OrderItemRow, Mb178OrderStatus } from "@/lib/mb178/types";

/* ──────────────────── Status Flow Config ──────────────────── */

const STATUS_FLOW: Record<string, Mb178OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  pending_payment: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  pending:
    "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  pending_payment:
    "border-amber-500/30 bg-amber-500/10 text-amber-300",
  processing:
    "border-blue-500/30 bg-blue-500/10 text-blue-300",
  shipped:
    "border-purple-500/30 bg-purple-500/10 text-purple-300",
  completed:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  cancelled:
    "border-red-500/30 bg-red-500/10 text-red-300",
};

/* ──────────────────── Order Detail Row ──────────────────── */

function OrderDetailRow({
  order,
  apiUrl,
  onStatusUpdated,
}: {
  order: Mb178OrderRow;
  apiUrl: (p: string) => string;
  onStatusUpdated: (id: string, newStatus: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<Mb178OrderItemRow[] | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStatuses = STATUS_FLOW[order.status] ?? [];

  const loadItems = useCallback(async () => {
    if (items !== null) return;
    setLoadingItems(true);
    try {
      const res = await fetch(apiUrl(`/api/owner/orders/${order.id}`));
      const json = (await res.json()) as {
        items?: Mb178OrderItemRow[];
        error?: string;
      };
      setItems(json.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [order.id, apiUrl, items]);

  const toggleExpand = useCallback(() => {
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (willExpand) void loadItems();
  }, [expanded, loadItems]);

  const updateStatus = useCallback(
    async (newStatus: string) => {
      setUpdating(true);
      setError(null);
      try {
        const res = await fetch(apiUrl("/api/owner/orders"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id, status: newStatus }),
        });
        const json = (await res.json()) as {
          order?: Mb178OrderRow;
          error?: string;
        };
        if (!res.ok) {
          setError(json.error ?? "Gagal memperbarui status.");
          return;
        }
        onStatusUpdated(order.id, newStatus);
      } catch {
        setError("Gagal terhubung ke server.");
      } finally {
        setUpdating(false);
      }
    },
    [order.id, apiUrl, onStatusUpdated],
  );

  const badgeClass =
    STATUS_BADGE_CLASS[order.status] ??
    "border-zinc-500/30 bg-zinc-500/10 text-zinc-300";

  return (
    <li className="rounded-2xl border border-white/[0.08] bg-white/[0.03] transition-colors hover:bg-white/[0.05]">
      {/* Collapsed summary */}
      <button
        type="button"
        className="flex w-full items-start gap-3 px-4 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
        onClick={toggleExpand}
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${badgeClass}`}
            >
              {labelOrderStatus(order.status)}
            </span>
            <span className="text-[11px] text-zinc-600">
              #{order.id.slice(0, 8)}
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-100">
            {order.customer_name || "Pelanggan"}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span>{formatRp(Number(order.total))}</span>
            <span>{formatDateId(order.created_at)}</span>
            {order.payment_method ? (
              <span className="uppercase">{order.payment_method}</span>
            ) : null}
          </div>
        </div>
        <span
          className={`mt-1 shrink-0 text-lg text-zinc-600 transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
        >
          ▶
        </span>
      </button>

      {/* Expanded detail */}
      {expanded ? (
        <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-4">
          {/* Customer info */}
          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
            {order.customer_phone ? (
              <div>
                <span className="text-zinc-600">Telepon: </span>
                <a
                  href={`https://wa.me/${order.customer_phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 underline-offset-2 hover:underline"
                >
                  {order.customer_phone}
                </a>
              </div>
            ) : null}
            <div>
              <span className="text-zinc-600">Channel: </span>
              <span className="uppercase">{order.channel}</span>
            </div>
          </div>
          {order.notes ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-400">
              <span className="text-zinc-600">Catatan: </span>
              {order.notes}
            </div>
          ) : null}

          {/* Order items */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
              Item Pesanan
            </p>
            {loadingItems ? (
              <p className="text-xs text-zinc-600 animate-pulse">Memuat…</p>
            ) : items && items.length > 0 ? (
              <table className="w-full text-xs text-zinc-400">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-zinc-600">
                    <th className="pb-1.5 font-medium">Produk</th>
                    <th className="pb-1.5 text-right font-medium">Qty</th>
                    <th className="pb-1.5 text-right font-medium">Harga</th>
                    <th className="pb-1.5 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-b border-zinc-800/50">
                      <td className="py-1.5 pr-2 text-zinc-300">
                        {it.name_snapshot}
                        <span className="ml-1 text-zinc-600">
                          ({it.unit_snapshot})
                        </span>
                      </td>
                      <td className="py-1.5 text-right">{formatQty(it.qty)}</td>
                      <td className="py-1.5 text-right">
                        {formatRp(Number(it.price_snapshot))}
                      </td>
                      <td className="py-1.5 text-right text-amber-200/80">
                        {formatRp(Number(it.line_total))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      colSpan={3}
                      className="pt-2 text-right font-semibold text-zinc-300"
                    >
                      Total
                    </td>
                    <td className="pt-2 text-right font-semibold text-amber-200">
                      {formatRp(Number(order.total))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="text-xs text-zinc-600">Tidak ada item.</p>
            )}
          </div>

          {/* Status actions */}
          {nextStatuses.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {nextStatuses.map((ns) => {
                const isCancel = ns === "cancelled";
                return (
                  <button
                    key={ns}
                    type="button"
                    disabled={updating}
                    onClick={() => void updateStatus(ns)}
                    className={`rounded-xl border px-4 py-2 text-xs font-semibold transition disabled:opacity-40 ${
                      isCancel
                        ? "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
                    }`}
                  >
                    {updating ? "…" : `→ ${labelOrderStatus(ns)}`}
                  </button>
                );
              })}
            </div>
          ) : null}
          {error ? (
            <p className="text-xs text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

/* ──────────────────── Filter Tabs ──────────────────── */

type FilterTab = "all" | Mb178OrderStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Baru" },
  { key: "processing", label: "Proses" },
  { key: "shipped", label: "Dikirim" },
  { key: "completed", label: "Selesai" },
  { key: "cancelled", label: "Batal" },
];

/* ──────────────────── Main Page ──────────────────── */

export default function OwnerOrdersPage() {
  const { appendApiUrl, ready } = useOwnerStoreScope();
  const [orders, setOrders] = useState<Mb178OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");

  /* Fetch orders */
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(appendApiUrl("/api/owner/orders"));
        const json = (await res.json()) as {
          orders?: Mb178OrderRow[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? "Gagal memuat pesanan.");
          setOrders([]);
        } else {
          setOrders(json.orders ?? []);
        }
      } catch {
        if (!cancelled) setError("Tidak dapat terhubung ke server.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, appendApiUrl]);

  /* Optimistic status update */
  const onStatusUpdated = useCallback((id: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: newStatus as Mb178OrderStatus } : o,
      ),
    );
  }, []);

  /* Filtered list */
  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  /* Counts per status */
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  return (
    <div className="px-4 py-8 md:mx-auto md:max-w-lg">
      <h1 className="font-serif text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
        Kelola Pesanan
      </h1>

      {/* Filter tabs */}
      <div className="mt-5 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_TABS.map(({ key, label }) => {
          const active = filter === key;
          const count = counts[key] ?? 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-200"
                  : "border-white/10 bg-white/[0.03] text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
              {count > 0 ? (
                <span
                  className={`ml-1.5 inline-block min-w-[1.25rem] rounded-full px-1 text-center text-[10px] font-bold ${
                    active
                      ? "bg-amber-500/25 text-amber-200"
                      : "bg-white/5 text-zinc-600"
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="mt-10 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]"
            />
          ))}
        </div>
      ) : error ? (
        <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-950/20 p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-700 py-12 text-center">
          <p className="text-sm text-zinc-500">
            {filter === "all"
              ? "Belum ada pesanan untuk toko ini."
              : `Tidak ada pesanan dengan status "${FILTER_TABS.find((t) => t.key === filter)?.label}".`}
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {filtered.map((o) => (
            <OrderDetailRow
              key={o.id}
              order={o}
              apiUrl={appendApiUrl}
              onStatusUpdated={onStatusUpdated}
            />
          ))}
        </ul>
      )}

      {/* Summary stats */}
      {!loading && orders.length > 0 ? (
        <div className="mt-8 grid grid-cols-3 gap-2">
          {[
            {
              label: "Total Pesanan",
              value: String(orders.length),
            },
            {
              label: "Aktif",
              value: String(
                orders.filter(
                  (o) =>
                    o.status !== "completed" && o.status !== "cancelled",
                ).length,
              ),
            },
            {
              label: "Pendapatan",
              value: formatRp(
                orders
                  .filter(
                    (o) =>
                      o.status !== "cancelled" &&
                      o.status !== "pending" &&
                      o.status !== "pending_payment",
                  )
                  .reduce((s, o) => s + Number(o.total), 0),
              ),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center"
            >
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                {stat.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-amber-200/90">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
