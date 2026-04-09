import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/app/api/owner/_session";
import { createMb178Client } from "@/lib/supabase/admin";
import type { Mb178StoreRow } from "@/lib/mb178/types";
import { hintForSupabaseError } from "@/lib/supabase/error-hints";

export async function GET() {
  const session = await requireOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createMb178Client();
  if (!supabase) {
    return NextResponse.json({ connected: false, store: null });
  }

  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", session.user.storeId!)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: hintForSupabaseError(error.message) },
      { status: 503 }
    );
  }

  return NextResponse.json({
    connected: true,
    store: data as Mb178StoreRow | null,
  });
}

export async function PATCH(request: Request) {
  const session = await requireOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createMb178Client();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase tidak dikonfigurasi" },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  const str = (k: string) =>
    typeof body[k] === "string" ? (body[k] as string) : undefined;
  const num = (k: string) =>
    typeof body[k] === "number" && !Number.isNaN(body[k] as number)
      ? (body[k] as number)
      : undefined;
  const bool = (k: string) =>
    typeof body[k] === "boolean" ? (body[k] as boolean) : undefined;

  const name = str("name");
  const address = str("address");
  const whatsapp_link = str("whatsapp_link");
  const lat = num("lat");
  const lng = num("lng");
  const average_rating = num("average_rating");
  const hide_zero_stock_from_catalog = bool("hide_zero_stock_from_catalog");

  if (name !== undefined) patch.name = name;
  if (address !== undefined) patch.address = address || null;
  if (whatsapp_link !== undefined) patch.whatsapp_link = whatsapp_link || null;
  if (lat !== undefined) patch.lat = lat;
  if (lng !== undefined) patch.lng = lng;
  if (average_rating !== undefined) {
    patch.average_rating = Math.min(5, Math.max(0, average_rating));
  }
  if (hide_zero_stock_from_catalog !== undefined) {
    patch.hide_zero_stock_from_catalog = hide_zero_stock_from_catalog;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Tidak ada field untuk diubah" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("stores")
    .update(patch)
    .eq("id", session.user.storeId!)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: hintForSupabaseError(error.message) },
      { status: 503 }
    );
  }

  return NextResponse.json({ store: data as Mb178StoreRow | null });
}
