import type { SupabaseClient } from "@supabase/supabase-js";

/** Nama file aman untuk object key Storage. */
export function safeProductImageFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

/** Slug aman untuk segmen path (folder per toko). */
export function safeSlugSegment(slug: string): string {
  const s = slug.trim().replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  return s || "store";
}

/**
 * Path di dalam bucket `mb178_assets`: satu folder per toko (slug), lalu `products/`.
 * Contoh: `stores/pupuk-maju/products/1735123456789-foto.jpg`
 */
export async function resolveProductImageObjectPath(
  supabase: SupabaseClient,
  storeId: string,
  originalFileName: string
): Promise<{ path: string } | { error: string }> {
  const { data, error } = await supabase
    .from("stores")
    .select("slug")
    .eq("id", storeId)
    .maybeSingle();

  if (error) return { error: error.message };
  const rawSlug = data?.slug?.trim();
  if (!rawSlug) {
    return { error: "Toko tidak ditemukan (slug) untuk path unggah" };
  }

  const seg = safeSlugSegment(rawSlug);
  const path = `stores/${seg}/products/${Date.now()}-${safeProductImageFileName(originalFileName)}`;
  return { path };
}
