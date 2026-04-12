import { safeCatalogImageUrl } from "@/lib/mb178/safe-remote-image";

/**
 * Nama file harus sama persis dengan isi folder `public/toko_images/`.
 * Key = `stores.slug` dari Supabase.
 */
const STORE_SLUG_TO_IMAGE_FILE: Record<string, string> = {
  "rocell-gadget": "rocell gadget.jpg",
  "pestisida-mbp": "pestisida maju bersama.jpg",
  "pakan-pei": "pakan PE'I maju bersama.jpg",
  "rosaura-skin-clinic": "rosauraskinclinic.jpg",
  "drg-sona": "klinik drg.Sona.jpg",
  "raniah-travel": "Raniah travel umroh dan haji.jpg",
  "pupuk-maju": "maju bersama pupuk&alat pertanian.jpg",
  "dapurku-seafood": "restoran seafood dapurku by cheff HENDRA.jpg",
};

export function localTokoImagePublicPath(filename: string): string {
  return `/toko_images/${encodeURIComponent(filename)}`;
}

/** Gambar kartu toko: prioritas aset lokal per slug, lalu URL aman dari DB. */
export function resolveStoreFrontImage(
  slug: string,
  dbProfileUrl: string | null | undefined,
  supabaseOrigin?: string,
): string {
  const file = STORE_SLUG_TO_IMAGE_FILE[slug];
  if (file) return localTokoImagePublicPath(file);
  return safeCatalogImageUrl(dbProfileUrl, supabaseOrigin);
}
