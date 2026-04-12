import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/app/api/owner/_session";
import { requireResolvedStoreId } from "@/app/api/owner/_store-id";
import { createMb178Client } from "@/lib/supabase/admin";
import { computeRadarAxes } from "@/lib/mb178/radar";
import { hintForSupabaseError } from "@/lib/supabase/error-hints";

export async function GET(request: Request) {
  const session = await requireOwnerSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createMb178Client();
  if (!supabase) {
    return NextResponse.json({
      connected: false,
      totalProducts: 0,
      totalStock: 0,
      orderCount: 0,
      revenue: 0,
      rating05: 4.5,
      radar: computeRadarAxes({
        totalStock: 320,
        orderCount: 18,
        rating05: 4.5,
      }),
    });
  }

  const storeIdOrErr = requireResolvedStoreId(session);
  if (storeIdOrErr instanceof NextResponse) return storeIdOrErr;
  const storeId = storeIdOrErr;

  const [productsRes, ordersRes, storeRes] = await Promise.all([
    supabase.from("products").select("stock, price").eq("store_id", storeId),
    supabase
      .from("orders")
      .select("total, status")
      .eq("store_id", storeId),
    supabase
      .from("stores")
      .select("average_rating")
      .eq("id", storeId)
      .maybeSingle(),
  ]);

  if (productsRes.error || ordersRes.error || storeRes.error) {
    const raw =
      productsRes.error?.message ??
      ordersRes.error?.message ??
      storeRes.error?.message ??
      "Query error";
    return NextResponse.json(
      {
        error: raw,
        hint:
          hintForSupabaseError(raw) ??
          "Pastikan tabel di `public` sudah dibuat (jalankan `supabase/setup-complete.sql`).",
      },
      { status: 503 }
    );
  }

  const products = productsRes.data ?? [];
  const orders = ordersRes.data ?? [];
  const totalStock = products.reduce((s, p) => s + Number(p.stock), 0);
  const totalProducts = products.length;
  const orderCount = orders.length;
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total), 0);
  const rating05 = Number(storeRes.data?.average_rating ?? 4.5);

  return NextResponse.json({
    connected: true,
    totalProducts,
    totalStock,
    orderCount,
    revenue,
    rating05,
    radar: computeRadarAxes({ totalStock, orderCount, rating05 }),
  });
}
