/** Domain sintetis internal MB178 (bukan domain surel pengguna nyata). */
const MB178_HOST = "mb178.online";

/** Bagian lokal alamat email, mis. `toko06` dari `toko06@mb178.online`. */
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
 * Daftar username staff deskriptif sesuai permintaan user.
 */
export const MB178_STAFF_DESCRIPTIVE_NAMES = [
  "pupuk01",
  "pesti02",
  "pakan03",
  "gita04",
  "sona05",
  "raniah06",
  "dapurku07",
  "rocell08",
];

/**
 * Pemetaan username (lokal part email) ke slug toko.
 * Mendukung format generik (tokoXX) dan deskriptif.
 */
export const MB178_STAFF_STORE_MAPPING: Record<string, string> = {
  // Format Generik
  toko01: "pupuk-majubersama",
  toko02: "pestisida-mbp",
  toko03: "pakan-pei",
  toko04: "rosaura-skin-clinic",
  toko05: "drg-sona",
  toko06: "raniah-travel",
  toko07: "dapurku-seafood",
  toko08: "rocell-gadget",
  // Format Deskriptif
  pupuk01: "pupuk-majubersama",
  pesti02: "pestisida-mbp",
  pakan03: "pakan-pei",
  gita04: "rosaura-skin-clinic",
  sona05: "drg-sona",
  raniah06: "raniah-travel",
  dapurku07: "dapurku-seafood",
  rocell08: "rocell-gadget",
};

/**
 * Pola akun staff seed: tokoXX, deskriptif (pupuk01...), master, mb178.
 * Dipakai hanya untuk UX (tombol navigasi + pesan setup), bukan pengganti RLS.
 */
export function isMb178SeedStaffLocalPart(local: string): boolean {
  const t = local.trim().toLowerCase();
  if (!t) return false;
  if (t === "master" || t === "mb178") return true;
  if (/^toko\d{2}$/.test(t)) return true;
  return MB178_STAFF_DESCRIPTIVE_NAMES.includes(t);
}

export function isMb178SeedStaffEmail(
  email: string | null | undefined
): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  if (!lower.endsWith(`@${MB178_HOST}`)) return false;
  const local = mb178EmailLocalPart(lower);
  if (isMb178CustomerPhoneLocalPart(local)) return false;
  return isMb178SeedStaffLocalPart(local);
}

/** Helper untuk mendapatkan slug toko dari username staff. */
export function getStoreSlugByStaffLocalPart(local: string): string | null {
  return MB178_STAFF_STORE_MAPPING[local.trim().toLowerCase()] || null;
}
