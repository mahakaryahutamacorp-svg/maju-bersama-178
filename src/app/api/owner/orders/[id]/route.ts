import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/app/api/owner/_session";
import { requireResolvedStoreId } from "@/app/api/owner/_store-id";
import { createMb178Client } from "@/lib/supabase/admin";
import { hintForSupabaseError } from "@/lib/supabase/error-hints";

type Ctx = { params: Promise<{ id: string }> };

/** Update status pesanan. */
export async function PATCH(request: Request, ctx: Ctx) {
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

  const status =
    typeof body.status === "string" ? body.status.trim() : undefined;
  if (!status) {
    return NextResponse.json(
      { error: "Field 'status' wajib" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .eq("store_id", storeIdOrErr)
    .select("id, status")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: hintForSupabaseError(error.message) },
      { status: 503 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Pesanan tidak ditemukan" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, order: data });
}
