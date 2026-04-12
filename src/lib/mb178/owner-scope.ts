/** Persistensi pilihan toko untuk Master Admin (localStorage). */
export const MB178_ADMIN_STORE_KEY = "mb178_super_admin_store_id";

export function appendStoreScope(
  path: string,
  storeId: string | null | undefined
): string {
  const id = storeId?.trim();
  if (!id) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}store_id=${encodeURIComponent(id)}`;
}
