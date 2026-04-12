/**
 * Normalisasi URL gambar banner dari seed/template (mis. placeholder domain).
 */
export function normalizeBannerImageUrl(
  raw: string,
  supabaseOrigin: string | undefined
): string | null {
  const trimmed = raw.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  let out = trimmed;
  if (out.includes("[id-proyek]") && supabaseOrigin) {
    try {
      const host = new URL(supabaseOrigin).origin;
      out = out.replace(/https:\/\/\[id-proyek\]\.supabase\.co/gi, host);
    } catch {
      return null;
    }
  }
  try {
    new URL(out);
    return out;
  } catch {
    return null;
  }
}
