"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseRouteClient } from "@/lib/supabase/ssr";
import { createMb178Client } from "@/lib/supabase/admin";

export interface CheckoutCartLineInput {
  productId: string;
  qty: number;
}

export type CheckoutCartResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

function mapCheckoutError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("not_authenticated")) return "Silakan masuk terlebih dahulu.";
  if (m.includes("empty_cart")) return "Keranjang kosong.";
  if (m.includes("invalid_qty")) return "Jumlah tidak valid.";
  if (m.includes("product_not_found")) return "Produk tidak ditemukan.";
  if (m.includes("product_wrong_store")) return "Produk tidak berasal dari toko yang sama.";
  if (m.includes("insufficient_stock")) return "Stok tidak mencukupi.";
  return "Checkout gagal. Coba lagi.";
}

export async function checkoutCartAction(input: {
  storeId: string;
  paymentMethod: "transfer" | "cod" | "offline";
  customerName: string;
  customerPhone: string;
  notes?: string;
  lines: CheckoutCartLineInput[];
}): Promise<CheckoutCartResult> {
  /* Verifikasi auth via cookie-based client */
  const supabase = await createSupabaseRouteClient();
  if (!supabase) {
    return { ok: false, error: "Supabase belum dikonfigurasi." };
  }

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return { ok: false, error: "Silakan masuk terlebih dahulu." };
  }

  const items = input.lines
    .filter((l) => l.productId && l.qty > 0)
    .map((l) => ({ product_id: l.productId, qty: Math.floor(l.qty) }));

  if (items.length === 0) {
    return { ok: false, error: "Keranjang kosong." };
  }

  /*
   * RPC mb178_checkout hanya bisa dipanggil oleh service_role (SECURITY DEFINER).
   * Kita sudah verifikasi identitas user di atas, lalu jalankan via admin client.
   */
  const admin = createMb178Client();
  if (!admin) {
    return { ok: false, error: "Service role belum dikonfigurasi." };
  }

  const { data, error } = await admin.rpc("mb178_checkout", {
    p_customer_id: auth.user.id,
    p_store_id: input.storeId,
    p_channel: "online",
    p_payment_method: input.paymentMethod,
    p_customer_name: input.customerName.trim(),
    p_customer_phone: input.customerPhone.trim(),
    p_notes: (input.notes ?? "").trim(),
    p_items: items,
  });

  if (error) {
    return { ok: false, error: mapCheckoutError(error.message) };
  }

  const orderId = typeof data === "string" ? data : null;
  if (!orderId) {
    return { ok: false, error: "Respons checkout tidak valid." };
  }

  revalidatePath("/orders");
  revalidatePath("/cart");
  return { ok: true, orderId };
}
