import Link from "next/link";
import type { Mb178OrderItemRow, Mb178OrderRow } from "@/lib/mb178/types";
import { createSupabaseServerComponentClient } from "@/lib/supabase/ssr";

type OrderWithRelations = Mb178OrderRow & {
  stores: { slug: string; name: string } | { slug: string; name: string }[] | null;
  order_items: Mb178OrderItemRow[];
};

function normalizeStore(
  s: OrderWithRelations["stores"]
): { slug: string; name: string } | null {
  if (!s) return null;
  return Array.isArray(s) ? (s[0] ?? null) : s;
}

function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function OrdersPage() {
  const supabase = await createSupabaseServerComponentClient();
  if (!supabase) {
    return (
      <div className="px-4 py-10 text-center">
        <h1 className="font-serif text-2xl text-amber-200/90">Pesanan</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Konfigurasi Supabase diperlukan untuk memuat riwayat.
        </p>
      </div>
    );
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return (
      <div className="px-4 py-10 text-center">
        <h1 className="font-serif text-2xl text-amber-200/90">Pesanan</h1>
        <p className="mt-2 text-sm text-zinc-500">
          <Link href="/login?callbackUrl=/orders" className="text-amber-400 underline underline-offset-4">
            Masuk
          </Link>{" "}
          untuk melihat pesanan Anda.
        </p>
      </div>
    );
  }

  const { data: rows, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      store_id,
      channel,
      payment_method,
      status,
      customer_id,
      customer_name,
      customer_phone,
      notes,
      total,
      created_at,
      stores ( slug, name ),
      order_items (
        id,
        order_id,
        product_id,
        name_snapshot,
        unit_snapshot,
        price_snapshot,
        qty,
        line_total,
        created_at
      )
    `
    )
    .eq("customer_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="px-4 py-10">
        <h1 className="font-serif text-2xl text-amber-200/90">Pesanan</h1>
        <p className="mt-2 text-sm text-red-300/90">{error.message}</p>
      </div>
    );
  }

  const orders = (rows ?? []) as unknown as OrderWithRelations[];

  if (orders.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <h1 className="font-serif text-2xl text-amber-200/90">Pesanan</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Belum ada pesanan. Checkout dari keranjang setelah memilih barang di toko.
        </p>
        <Link
          href="/cart"
          className="mt-4 inline-block text-sm text-amber-400 underline underline-offset-4"
        >
          Buka keranjang
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 pb-28 md:mx-auto md:max-w-lg">
      <h1 className="font-serif text-2xl text-amber-200/90">Pesanan</h1>
      <p className="mt-1 text-xs text-zinc-500">Riwayat pesanan Anda (per toko).</p>

      <ul className="mt-6 space-y-6">
        {orders.map((o) => {
          const store = normalizeStore(o.stores);
          return (
          <li
            key={o.id}
            className="rounded-2xl border border-yellow-600/15 bg-zinc-900/40 p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  {store?.name ?? "Toko"}
                </p>
                {store?.slug ? (
                  <Link
                    href={`/store/${store.slug}`}
                    className="text-xs text-amber-500/90 hover:underline"
                  >
                    /store/{store.slug}
                  </Link>
                ) : null}
              </div>
              <span className="rounded-lg border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
                {o.status}
              </span>
            </div>
            <p className="mt-2 text-lg font-semibold text-amber-200/90">
              {formatRp(Number(o.total))}
            </p>
            <p className="text-xs text-zinc-500">
              {new Date(o.created_at).toLocaleString("id-ID")}
            </p>
            <ul className="mt-3 space-y-1 border-t border-zinc-800 pt-3">
              {(o.order_items ?? []).map((it) => (
                <li key={it.id} className="text-xs text-zinc-400">
                  {it.name_snapshot}{" "}
                  <span className="text-zinc-600">
                    ×{Number(it.qty)} @ {formatRp(Number(it.price_snapshot))}
                  </span>{" "}
                  → {formatRp(Number(it.line_total))}
                </li>
              ))}
            </ul>
          </li>
        );
        })}
      </ul>
    </div>
  );
}
