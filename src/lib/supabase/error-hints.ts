export function hintForSupabaseError(message: string) {
  const m = message.toLowerCase();

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

