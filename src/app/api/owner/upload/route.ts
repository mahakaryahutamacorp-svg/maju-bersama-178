import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/app/api/owner/_session";
import { requireResolvedStoreId } from "@/app/api/owner/_store-id";
import { resolveProductImageObjectPath } from "@/lib/mb178/product-storage-path";
import { createMb178Client } from "@/lib/supabase/admin";
import { hintForSupabaseError } from "@/lib/supabase/error-hints";

const BUCKET = "mb178_assets";

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

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Field 'file' wajib" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  if (!mime.startsWith("image/")) {
    return NextResponse.json(
      { error: "Hanya file gambar yang didukung" },
      { status: 400 }
    );
  }

  const original =
    typeof (file as File).name === "string"
      ? (file as File).name
      : "upload";
  const resolved = await resolveProductImageObjectPath(
    supabase,
    storeIdOrErr,
    original
  );
  if ("error" in resolved) {
    return NextResponse.json(
      { error: resolved.error, hint: hintForSupabaseError(resolved.error) },
      { status: 400 }
    );
  }
  const path = resolved.path;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: false });

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        bucket: BUCKET,
        hint: hintForSupabaseError(error.message),
      },
      { status: 503 }
    );
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ path, publicUrl: pub.publicUrl });
}
