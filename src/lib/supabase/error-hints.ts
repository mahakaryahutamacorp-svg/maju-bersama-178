export function hintForSupabaseError(message: string) {
  const m = message.toLowerCase();

  if (m.includes("invalid schema") && m.includes("mb178")) {
    return [
      "Supabase menolak schema `mb178` via API.",
      "Buka Supabase Dashboard → Settings → API → bagian `Exposed schemas`, lalu tambahkan `mb178`.",
      "Tunggu 10–30 detik (PostgREST reload) lalu refresh halaman.",
    ].join(" ");
  }

  if (m.includes("permission denied") || m.includes("rls") || m.includes("row level security")) {
    return "Kemungkinan RLS/policy membatasi akses. Untuk operasi owner, isi `SUPABASE_SERVICE_ROLE_KEY` (server-only) atau buat policy RLS untuk role `anon`/`authenticated` sesuai kebutuhan.";
  }

  return null;
}

