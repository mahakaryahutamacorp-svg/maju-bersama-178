import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/app/api/owner/_session";
import { createMb178Client } from "@/lib/supabase/admin";
import type { Mb178StoreRow } from "@/lib/mb178/types";
import { hintForSupabaseError } from "@/lib/supabase/error-hints";

/** Daftar toko: semua untuk super_admin, satu untuk owner. */
export async function GET(request: Request) {
  const session = await requireOwnerSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createMb178Client();
  if (!supabase) {
    return NextResponse.json({ connected: false, stores: [] as Mb178StoreRow[] });
  }

  const { role, storeId } = session.user;

  if (role === "super_admin") {
    const { data, error } = await supabase
      .from("stores")
      .select("id, slug, name, address, phone, whatsapp_link, profile_image_url, lat, lng, average_rating, hide_zero_stock_from_catalog, created_at")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message, hint: hintForSupabaseError(error.message) },
        { status: 503 }
      );
    }

    return NextResponse.json({
      connected: true,
      stores: (data ?? []) as Mb178StoreRow[],
    });
  }

  if (role === "owner" && storeId) {
    const { data, error } = await supabase
      .from("stores")
      .select("id, slug, name, address, phone, whatsapp_link, profile_image_url, lat, lng, average_rating, hide_zero_stock_from_catalog, created_at")
      .eq("id", storeId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message, hint: hintForSupabaseError(error.message) },
        { status: 503 }
      );
    }

    return NextResponse.json({
      connected: true,
      stores: data ? ([data] as Mb178StoreRow[]) : [],
    });
  }

  return NextResponse.json({ connected: true, stores: [] as Mb178StoreRow[] });
}
