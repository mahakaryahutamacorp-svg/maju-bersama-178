export function hintForSupabaseError(message: string) {
  const m = message.toLowerCase();

  if (
    m.includes("bucket not found") ||
    (m.includes("not found") && m.includes("bucket")) ||
    m.includes("object not found")
  ) {
    return [
      "Bucket Storage belum ada atau salah nama.",
      "Jalankan `supabase/02-storage-mb178-assets.sql` di SQL Editor, atau buat bucket `mb178_assets` (publik) di Dashboard → Storage.",
    ].join(" ");
  }

  if (m.includes("mime type") || m.includes("mime_type") || m.includes("invalid mime")) {
    return "Jenis file tidak diizinkan untuk bucket. Unggah JPEG/PNG/WebP/GIF, atau perbarui allowed_mime_types di bucket.";
  }

  if (m.includes("payload too large") || m.includes("file size") || m.includes("too large")) {
    return "File terlalu besar. Perkecil gambar atau naikkan file_size_limit bucket di Supabase.";
  }

  if (m.includes("invalid schema") || m.includes("schema cache")) {
    return [
      "PostgREST tidak mengenali schema/tabel.",
      "Pastikan skrip `supabase/setup-complete.sql` sudah dijalankan (tabel di `public`).",
      "Di Settings → API, pastikan `public` ada di Exposed schemas (biasanya default).",
    ].join(" ");
  }

  if (m.includes("permission denied") || m.includes("rls") || m.includes("row level security")) {
    return "Kemungkinan RLS/policy membatasi akses. Untuk operasi owner, isi `SUPABASE_SERVICE_ROLE_KEY` (server-only) atau buat policy RLS untuk role `anon`/`authenticated` sesuai kebutuhan.";
  }

  return null;
}

