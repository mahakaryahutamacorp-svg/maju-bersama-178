import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/app/api/owner/_session";
import { requireResolvedStoreId } from "@/app/api/owner/_store-id";
import { createMb178Client } from "@/lib/supabase/admin";
import { hintForSupabaseError } from "@/lib/supabase/error-hints";

export async function GET(request: Request) {
  const session = await requireOwnerSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createMb178Client();
  if (!supabase) {
    return NextResponse.json({ error: "Service role key missing" }, { status: 503 });
  }

  const storeIdOrErr = requireResolvedStoreId(session);
  if (storeIdOrErr instanceof NextResponse) return storeIdOrErr;
  const storeId = storeIdOrErr;

  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days") || "30", 10);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  /* Query orders with filters */
  const { data: orders, error } = await supabase
    .from("orders")
    .select("total, status, created_at, payment_method")
    .eq("store_id", storeId)
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: hintForSupabaseError(error.message) },
      { status: 503 }
    );
  }

  /* Process data for charts/tables */
  const validOrders = (orders ?? []).filter(
    (o) => o.status !== "cancelled" && o.status !== "pending" && o.status !== "pending_payment"
  );

  const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalOrders = validOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  /* Group by date */
  const daily: Record<string, { date: string; revenue: number; orders: number }> = {};
  
  // Fill in gaps
  for (let i = 0; i <= days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    daily[key] = { date: key, revenue: 0, orders: 0 };
  }

  validOrders.forEach((o) => {
    const key = o.created_at.split("T")[0];
    if (daily[key]) {
      daily[key].revenue += Number(o.total);
      daily[key].orders += 1;
    }
  });

  const chartData = Object.values(daily).sort((a, b) => a.date.localeCompare(b.date));

  /* Group by payment method */
  const byPayment: Record<string, number> = {};
  validOrders.forEach((o) => {
    const m = o.payment_method || "unknown";
    byPayment[m] = (byPayment[m] || 0) + Number(o.total);
  });

  return NextResponse.json({
    summary: {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      periodDays: days,
    },
    daily: chartData,
    byPayment,
  });
}
