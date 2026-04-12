const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80";

/**
 * Hanya URL https ke host yang diizinkan next/image — selain itu fallback (katalog tidak crash).
 */
export function safeCatalogImageUrl(
  raw: string | null | undefined,
  supabaseProjectUrl: string | undefined,
  fallback: string = DEFAULT_FALLBACK,
): string {
  const u = raw?.trim();
  if (!u || !/^https:\/\//i.test(u)) return fallback;
  let hostname = "";
  try {
    hostname = new URL(u).hostname.toLowerCase();
  } catch {
    return fallback;
  }
  if (hostname === "images.unsplash.com") return u;
  if (supabaseProjectUrl) {
    try {
      if (hostname === new URL(supabaseProjectUrl).hostname.toLowerCase()) return u;
    } catch {
      /* ignore */
    }
    if (hostname.endsWith(".supabase.co")) return u;
  }
  return fallback;
}
