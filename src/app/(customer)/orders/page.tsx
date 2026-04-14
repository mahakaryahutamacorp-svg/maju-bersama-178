import Link from "next/link";
import { labelOrderStatus } from "@/lib/mb178/order-status";
import type { Mb178OrderRow } from "@/lib/mb178/types";
import { createSupabaseServerComponentClient } from "@/lib/supabase/ssr";

function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function OrdersPage() {
  const supabase = await createSupabaseServerComponentClient();

  if (!supabase) {
    return (
      <div className="px-4 py-10 text-center">
        <h1 className="font-serif text-2xl text-amber-200/90">Pesanan</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Konfigurasi Supabase (env) diperlukan untuk memuat pesanan.
        </p>
      </div>
    );
  }

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    return (
      <div className="px-4 py-10 text-center">
        <h1 className="font-serif text-2xl text-amber-200/90">Pesanan</h1>
        <p className="mt-2 text-sm text-zinc-500">
          <Link href="/login" className="text-amber-400 underline underline-offset-4">
            Masuk
          </Link>{" "}
          untuk melihat riwayat pesanan.
        </p>
      </div>
    );
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, store_id, total, status, created_at")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="px-4 py-10 text-center">
        <h1 className="font-serif text-2xl text-amber-200/90">Pesanan</h1>
        <p className="mt-2 text-sm text-red-300/90">{error.message}</p>
      </div>
    );
  }

  const list = (orders ?? []) as Pick<
    Mb178OrderRow,
    "id" | "store_id" | "total" | "status" | "created_at"
  >[];

  const storeIds = [...new Set(list.map((o) => o.store_id))];
  let storeNameById = new Map<string, string>();
  if (storeIds.length > 0) {
    const { data: stores } = await supabase.from("stores").select("id, name").in("id", storeIds);
    if (stores?.length) {
      storeNameById = new Map(
        (stores as { id: string; name: string }[]).map((s) => [s.id, s.name]),
      );
    }
  }

  return (
    <div className="px-4 py-10 md:mx-auto md:max-w-lg">
      <h1 className="font-serif text-2xl text-amber-200/90">Pesanan</h1>
      {list.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          Belum ada pesanan. Checkout dari{" "}
          <Link href="/cart" className="text-amber-400 underline underline-offset-4">
            keranjang
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {list.map((o) => (
            <li
              key={o.id}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300"
            >
              <p className="font-medium text-zinc-100">
                {storeNameById.get(o.store_id) ?? "Toko"}
              </p>
              <p className="mt-1 text-amber-200/90">{formatRp(Number(o.total))}</p>
              <p className="mt-1 text-xs text-zinc-500">{labelOrderStatus(o.status)}</p>
              <p className="mt-1 text-[11px] text-zinc-600">{formatDate(o.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
