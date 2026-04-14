"use server";

import { createMb178Client } from "@/lib/supabase/admin";
import { createSupabaseRouteClient } from "@/lib/supabase/ssr";

export interface CheckoutCartLineInput {
  product_id: string;
  qty: number;
}

export interface HandleCheckoutInput {
  store_id: string;
  items: CheckoutCartLineInput[];
  channel?: string;
  payment_method?: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  notes?: string | null;
}

export type CheckoutResult =
  | { ok: true; order_id: string }
  | { ok: false; error: string };

/**
 * Checkout atomik: RPC `mb178_checkout` (transaksi tunggal di Postgres).
 * Sesi pelanggan diverifikasi dengan anon client; RPC dipanggil dengan service role.
 */
export async function handleCheckout(
  input: HandleCheckoutInput
): Promise<CheckoutResult> {
  const supabase = await createSupabaseRouteClient();
  if (!supabase) {
    return { ok: false, error: "Supabase belum dikonfigurasi." };
  }

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return { ok: false, error: "Silakan masuk untuk checkout." };
  }

  const admin = createMb178Client();
  if (!admin) {
    return { ok: false, error: "Server checkout tidak tersedia (service role)." };
  }

  const storeId = input.store_id?.trim();
  if (!storeId) {
    return { ok: false, error: "Toko tidak valid." };
  }

  const items = (input.items ?? []).filter(
    (l) =>
      typeof l.product_id === "string" &&
      l.product_id.length > 0 &&
      typeof l.qty === "number" &&
      Number.isInteger(l.qty) &&
      l.qty > 0
  );
  if (items.length === 0) {
    return { ok: false, error: "Keranjang kosong." };
  }

  const payload = items.map((l) => ({
    product_id: l.product_id,
    qty: l.qty,
  }));

  const { data, error } = await admin.rpc("mb178_checkout", {
    p_customer_id: auth.user.id,
    p_store_id: storeId,
    p_channel: input.channel ?? "online",
    p_payment_method: input.payment_method ?? "transfer",
    p_customer_name: input.customer_name ?? "",
    p_customer_phone: input.customer_phone ?? "",
    p_notes: input.notes ?? "",
    p_items: payload,
  });

  if (error) {
    return { ok: false, error: error.message || "Checkout gagal." };
  }

  const orderId = typeof data === "string" ? data : String(data ?? "");
  if (!orderId) {
    return { ok: false, error: "Tidak ada ID pesanan dikembalikan." };
  }

  return { ok: true, order_id: orderId };
}
