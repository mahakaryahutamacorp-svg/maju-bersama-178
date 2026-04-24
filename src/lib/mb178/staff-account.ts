/** Domain sintetis internal MB178 (bukan domain surel pengguna nyata). */
const MB178_HOST = "mb178.online";

/**
 * Bagian lokal alamat email, mis. `toko06` dari `toko06@mb178.online`.
 */
export function mb178EmailLocalPart(email: string | null | undefined): string {
  if (!email || typeof email !== "string") return "";
  const at = email.indexOf("@");
  const local = (at > 0 ? email.slice(0, at) : email).trim().toLowerCase();
  return local;
}

/** No. HP Indonesia yang dipetakan ke email sintetis (hanya digit, awalan 628). */
export function isMb178CustomerPhoneLocalPart(local: string): boolean {
  return /^628\d{8,12}$/.test(local);
}

/**
 * Pola akun staff seed (02-create-auth-users): toko01…toko99, master, mb178.
 * Dipakai hanya untuk UX (tombol navigasi + pesan setup), bukan pengganti RLS.
 */
export function isMb178SeedStaffLocalPart(local: string): boolean {
  const t = local.trim().toLowerCase();
  if (!t) return false;
  if (t === "master" || t === "mb178") return true;
  return /^toko\d{2}$/.test(t);
}

export function isMb178SeedStaffEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  if (!lower.endsWith(`@${MB178_HOST}`)) return false;
  const local = mb178EmailLocalPart(lower);
  if (isMb178CustomerPhoneLocalPart(local)) return false;
  return isMb178SeedStaffLocalPart(local);
}
