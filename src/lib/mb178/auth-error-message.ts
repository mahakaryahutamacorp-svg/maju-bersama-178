/**
 * Terjemahkan pesan error Supabase Auth ke teks yang jelas untuk pengguna MB178.
 * Aplikasi memakai email sintetis (@mb178.online) — provider Email di Supabase harus aktif.
 */
export function mb178SupabaseAuthMessage(
  raw: string | undefined,
  context: "owner_login" | "customer_login" | "register"
): string {
  const msg = (raw ?? "").trim();
  const lower = msg.toLowerCase();

  if (
    lower.includes("email logins are disabled") ||
    lower.includes("email signups are disabled") ||
    lower.includes("signup is disabled") ||
    (lower.includes("sign up") && lower.includes("disabled"))
  ) {
    return "Login lewat email dinonaktifkan di Supabase project Anda. Buka Supabase Dashboard → Authentication → Providers → Email: aktifkan provider Email. Untuk tombol Daftar Baru, aktifkan juga pendaftaran user baru (Allow new users to sign up). Tanpa ini, MB178 tidak bisa masuk/daftar karena no. HP dipetakan ke alamat @mb178.online.";
  }

  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid_grant") ||
    lower.includes("email not confirmed")
  ) {
    if (context === "owner_login") return "Username atau password salah.";
    if (context === "customer_login") return "No. HP atau password salah.";
    return "No. HP atau password salah.";
  }

  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "No. HP ini sudah terdaftar. Gunakan Masuk, atau reset password dari Supabase jika lupa PIN.";
  }

  if (msg) return msg;
  if (context === "owner_login") return "Username atau password salah.";
  if (context === "customer_login") return "No. HP atau password salah.";
  return "Gagal mendaftar atau masuk. Coba lagi.";
}
