import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/app/api/owner/_session";
import { createMb178Client } from "@/lib/supabase/admin";
import type { Mb178ProductRow } from "@/lib/mb178/types";
import { hintForSupabaseError } from "@/lib/supabase/error-hints";

const BUCKET = "mb178_assets";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

export async function GET() {
  const session = await requireOwnerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createMb178Client();
  if (!supabase) {
    return NextResponse.json({ connected: false, products: [] });
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", session.user.storeId!)
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

  const contentType = request.headers.get("content-type") ?? "";
  let name: string;
  let price: number;
  let stock: number;
  let imageFile: File | null = null;
  let imageUrl: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    name = String(form.get("name") ?? "").trim();
    price = Number(form.get("price"));
    stock = Number(form.get("stock"));
    const f = form.get("image");
    if (f && f instanceof File && f.size > 0) imageFile = f;
  } else {
    const body = (await request.json()) as Record<string, unknown>;
    name = String(body.name ?? "").trim();
    price = Number(body.price);
    stock = Number(body.stock);
    if (typeof body.image_url === "string") imageUrl = body.image_url;
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
    const path = `${session.user.storeId}/${Date.now()}-${safeFileName(imageFile.name)}`;
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
      store_id: session.user.storeId!,
      name,
      price,
      stock,
      image_url: imageUrl,
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
