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

export async function GET(request: Request) {
  const session = await requireOwnerSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storeIdOrErr = requireResolvedStoreId(session);
  if (storeIdOrErr instanceof NextResponse) return storeIdOrErr;

  const supabase = createMb178Client();
  if (!supabase) {
    return NextResponse.json({ connected: false, products: [] });
  }

  const { data, error } = await supabase
    .from("products")
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
    products: data as Mb178ProductRow[],
  });
}

export async function POST(request: Request) {
  const session = await requireOwnerSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storeIdOrErr = requireResolvedStoreId(session);
  if (storeIdOrErr instanceof NextResponse) return storeIdOrErr;

  const supabase = createMb178Client();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase tidak dikonfigurasi" },
      { status: 503 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  let name: string;
  let price: number;
  let stock: number;
  let description: string | null = null;
  let imageFile: File | null = null;
  let imageUrl: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    name = String(form.get("name") ?? "").trim();
    price = Number(form.get("price"));
    stock = Number(form.get("stock"));
    const descRaw = form.get("description");
    if (typeof descRaw === "string") {
      const t = descRaw.trim();
      description = t.length > 0 ? t : null;
    }
    const f = form.get("image");
    if (f && f instanceof File && f.size > 0) imageFile = f;
  } else {
    const body = (await request.json()) as Record<string, unknown>;
    name = String(body.name ?? "").trim();
    price = Number(body.price);
    stock = Number(body.stock);
    if (typeof body.image_url === "string") imageUrl = body.image_url;
    if (typeof body.description === "string") {
      const t = body.description.trim();
      description = t.length > 0 ? t : null;
    } else if (body.description === null) {
      description = null;
    }
  }

  if (!name || Number.isNaN(price) || price < 0 || Number.isNaN(stock) || stock < 0) {
    return NextResponse.json(
      { error: "name, price, dan stock wajib valid" },
      { status: 400 }
    );
  }

  if (imageFile) {
    const mime = imageFile.type || "application/octet-stream";
    if (!mime.startsWith("image/")) {
      return NextResponse.json(
        { error: "Gambar tidak valid" },
        { status: 400 }
      );
    }
    const path = `${storeIdOrErr}/${Date.now()}-${safeFileName(imageFile.name)}`;
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: mime, upsert: false });
    if (upErr) {
      return NextResponse.json(
        { error: upErr.message, bucket: BUCKET },
        { status: 503 }
      );
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    imageUrl = pub.publicUrl;
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      store_id: storeIdOrErr,
      name,
      price,
      stock,
      image_url: imageUrl,
      description,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: hintForSupabaseError(error.message) },
      { status: 503 }
    );
  }

  return NextResponse.json({ product: data as Mb178ProductRow });
}
