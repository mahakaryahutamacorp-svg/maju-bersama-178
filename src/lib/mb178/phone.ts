/**
 * Normalisasi nomor seluler Indonesia ke digit `62…` untuk email sintetis MB178.
 */

function digitsOnly(input: string): string {
  return input.replace(/\D/g, "");
}

/** True jika input tampak seperti nomor HP ID (bukan username huruf). */
export function looksLikeIndonesiaPhoneInput(raw: string): boolean {
  const t = raw.trim();
  if (!t || /[a-zA-Z]/.test(t)) return false;
  const d = digitsOnly(t);
  if (d.length < 10 || d.length > 14) return false;
  if (d.startsWith("08")) return true;
  if (d.startsWith("628")) return true;
  if (d.startsWith("62") && d.length >= 11) return true;
  if (d.startsWith("8") && d.length >= 9 && d.length <= 12) return true;
  return false;
}

/** Hasilkan `628…` dari 08… / 8… / 62… / +62…. */
export function normalizeIndonesiaPhoneForMb178(input: string): string {
  const d = digitsOnly(input);
  if (!d) return "";
  if (d.startsWith("62")) return d;
  if (d.startsWith("0")) return `62${d.slice(1)}`;
  if (d.startsWith("8")) return `62${d}`;
  return d;
}

/** Validasi longgar setelah normalisasi (seluler Indonesia). */
export function isValidIndonesiaMobileNormalized(normalized: string): boolean {
  return /^628\d{8,12}$/.test(normalized);
}

export function syntheticEmailForMb178LocalPart(localPart: string): string {
  return `${localPart}@local.mb178`;
}

/**
 * Mode pelanggan: nomor → email sintetis unik; selain itu anggap username lama (huruf/angka campur).
 */
export function customerPrincipalToSyntheticEmail(
  raw: string
):
  | { email: string; phoneDigits62: string | null }
  | { error: string } {
  const t = raw.trim();
  if (!t) {
    return { error: "No. HP atau username wajib diisi." };
  }
  if (looksLikeIndonesiaPhoneInput(t)) {
    const n = normalizeIndonesiaPhoneForMb178(t);
    if (!isValidIndonesiaMobileNormalized(n)) {
      return { error: "No. HP tidak valid. Gunakan format 08… atau +62…." };
    }
    return { email: syntheticEmailForMb178LocalPart(n), phoneDigits62: n };
  }
  return {
    email: syntheticEmailForMb178LocalPart(t.toLowerCase()),
    phoneDigits62: null,
  };
}
