import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/app/api/owner/_session";
import { requireResolvedStoreId } from "@/app/api/owner/_store-id";
import { createMb178Client } from "@/lib/supabase/admin";
import { hintForSupabaseError } from "@/lib/supabase/error-hints";

type Ctx = { params: Promise<{ id: string }> };

/** GET — Detail pesanan: order + items. */
export async function GET(request: Request, ctx: Ctx) {
  const session = await requireOwnerSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storeIdOrErr = requireResolvedStoreId(session);
  if (storeIdOrErr instanceof NextResponse) return storeIdOrErr;

  const { id } = await ctx.params;
  const supabase = createMb178Client();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service role belum dikonfigurasi" },
      { status: 503 },
    );
  }

  const [orderRes, itemsRes] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("store_id", storeIdOrErr)
      .maybeSingle(),
    supabase
      .from("order_items")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (orderRes.error) {
    return NextResponse.json(
      { error: orderRes.error.message, hint: hintForSupabaseError(orderRes.error.message) },
      { status: 503 },
    );
  }

  if (!orderRes.data) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({
    order: orderRes.data,
    items: itemsRes.data ?? [],
  });
}
