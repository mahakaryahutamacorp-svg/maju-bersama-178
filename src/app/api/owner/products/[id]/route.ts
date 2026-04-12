import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/app/api/owner/_session";
import { requireResolvedStoreId } from "@/app/api/owner/_store-id";
import { createMb178Client } from "@/lib/supabase/admin";
import type { Mb178ProductRow } from "@/lib/mb178/types";
import { hintForSupabaseError } from "@/lib/supabase/error-hints";

const BUCKET = "mb178_assets";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

type Ctx = { params: Promise<{ id: string }> };

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

  const contentType = request.headers.get("content-type") ?? "";
  const patch: Record<string, unknown> = {};

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const n = form.get("name");
    const p = form.get("price");
    const s = form.get("stock");
    const d = form.get("description");
    if (typeof n === "string" && n.trim()) patch.name = n.trim();
    if (p !== null && p !== "") {
      const price = Number(p);
      if (!Number.isNaN(price) && price >= 0) patch.price = price;
    }
    if (s !== null && s !== "") {
      const stock = Number(s);
      if (!Number.isNaN(stock) && stock >= 0) patch.stock = stock;
    }
    if (d !== null && d !== undefined) {
      if (typeof d === "string") {
        const t = d.trim();
        patch.description = t.length > 0 ? t : null;
      }
    }
    const f = form.get("image");
    if (f && f instanceof File && f.size > 0) {
      const mime = f.type || "application/octet-stream";
      if (!mime.startsWith("image/")) {
        return NextResponse.json(
          { error: "Gambar tidak valid" },
          { status: 400 }
        );
      }
      const path = `${storeIdOrErr}/${Date.now()}-${safeFileName(f.name)}`;
      const buffer = Buffer.from(await f.arrayBuffer());
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: mime, upsert: false });
      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 503 });
      }
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      patch.image_url = pub.publicUrl;
    }
  } else {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
    if (typeof body.price === "number" && body.price >= 0) patch.price = body.price;
    if (typeof body.stock === "number" && body.stock >= 0) patch.stock = body.stock;
    if (typeof body.image_url === "string") patch.image_url = body.image_url;
    if (typeof body.description === "string") {
      const t = body.description.trim();
      patch.description = t.length > 0 ? t : null;
    } else if (body.description === null) {
      patch.description = null;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .eq("store_id", storeIdOrErr)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: hintForSupabaseError(error.message) },
      { status: 503 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ product: data as Mb178ProductRow });
}

export async function DELETE(request: Request, ctx: Ctx) {
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

  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("store_id", storeIdOrErr)
    .select("id");

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: hintForSupabaseError(error.message) },
      { status: 503 }
    );
  }

  if (!data?.length) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
