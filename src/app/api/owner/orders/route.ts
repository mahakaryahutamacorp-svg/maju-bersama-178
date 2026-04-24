import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/app/api/owner/_session";
import { requireResolvedStoreId } from "@/app/api/owner/_store-id";
import { createMb178Client } from "@/lib/supabase/admin";
import { hintForSupabaseError } from "@/lib/supabase/error-hints";

/**
 * GET  — Daftar pesanan toko (owner/super_admin).
 * PATCH — Update status pesanan.
 */
export async function GET(request: Request) {
  const session = await requireOwnerSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storeIdOrErr = requireResolvedStoreId(session);
  if (storeIdOrErr instanceof NextResponse) return storeIdOrErr;

  const supabase = createMb178Client();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service role belum dikonfigurasi" },
      { status: 503 },
    );
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", storeIdOrErr)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: hintForSupabaseError(error.message) },
      { status: 503 },
    );
  }

  return NextResponse.json({ orders: orders ?? [] });
}

export async function PATCH(request: Request) {
  const session = await requireOwnerSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storeIdOrErr = requireResolvedStoreId(session);
  if (storeIdOrErr instanceof NextResponse) return storeIdOrErr;

  const supabase = createMb178Client();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service role belum dikonfigurasi" },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    orderId?: string;
    status?: string;
  };

  if (!body.orderId || !body.status) {
    return NextResponse.json(
      { error: "orderId dan status wajib diisi" },
      { status: 400 },
    );
  }

  const allowed = [
    "pending",
    "pending_payment",
    "processing",
    "shipped",
    "completed",
    "cancelled",
  ];
  if (!allowed.includes(body.status)) {
    return NextResponse.json(
      { error: `Status tidak valid. Pilihan: ${allowed.join(", ")}` },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status: body.status })
    .eq("id", body.orderId)
    .eq("store_id", storeIdOrErr)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: hintForSupabaseError(error.message) },
      { status: 503 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Pesanan tidak ditemukan di toko ini" },
      { status: 404 },
    );
  }

  return NextResponse.json({ order: data });
}
