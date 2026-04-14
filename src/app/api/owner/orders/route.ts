import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/app/api/owner/_session";
import { requireResolvedStoreId } from "@/app/api/owner/_store-id";
import { createMb178Client } from "@/lib/supabase/admin";
import type { Mb178OrderRow } from "@/lib/mb178/types";
import { hintForSupabaseError } from "@/lib/supabase/error-hints";

/** Daftar pesanan per toko untuk owner/super_admin. */
export async function GET(request: Request) {
  const session = await requireOwnerSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storeIdOrErr = requireResolvedStoreId(session);
  if (storeIdOrErr instanceof NextResponse) return storeIdOrErr;

  const supabase = createMb178Client();
  if (!supabase) {
    return NextResponse.json({ connected: false, orders: [] });
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", storeIdOrErr)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: hintForSupabaseError(error.message) },
      { status: 503 }
    );
  }

  return NextResponse.json({
    connected: true,
    orders: data as Mb178OrderRow[],
  });
}
