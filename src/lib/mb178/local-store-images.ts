import { safeCatalogImageUrl } from "@/lib/mb178/safe-remote-image";

/**
 * Nama file persis di /public/toko_images/ (ter-encode otomatis ke URL).
 * Kunci = slug baris `public.stores.slug` pada deployment Anda.
 */
const STORE_SLUG_TO_IMAGE_FILE: Record<string, string> = {
  "rocell-gadget": "rocell gadget.jpg",
  "rosaura-skin-clinic": "rosauraskinclinic.jpg",
  "pakan-pei": "pakan PE'I maju bersama.jpg",
  "dapurku-seafood": "restoran seafood dapurku by cheff HENDRA.jpg",
  "maju-bersama": "maju bersama pupuk&alat pertanian.jpg",
  "drg-sona": "klinik drg.Sona.jpg",
  "pestisida-mbp": "pestisida maju bersama.jpg",
  "raniah-travel": "Raniah travel umroh dan haji.jpg",
  // Seed demo dari setup-complete.sql (gambar dipetakan ke aset terdekat)
  "pupuk-maju": "maju bersama pupuk&alat pertanian.jpg",
  majubersamagrup: "maju bersama pupuk&alat pertanian.jpg",
  "toko-elektronik": "rocell gadget.jpg",
  "fashion-murah": "rosauraskinclinic.jpg",
  "toko-bangunan": "pestisida maju bersama.jpg",
  "sembako-berkah": "pakan PE'I maju bersama.jpg",
  "toko-alat-tulis": "klinik drg.Sona.jpg",
  "toko-kosmetik": "rosauraskinclinic.jpg",
};

/** Gambar kartu toko: lokal per slug, fallback aman jika URL DB tidak valid. */
export function resolveStoreCardImage(
  slug: string,
  profileImageUrl: string | null | undefined,
  supabaseOrigin: string | undefined,
): string {
  const file = STORE_SLUG_TO_IMAGE_FILE[slug];
  if (file) {
    return `/toko_images/${encodeURIComponent(file)}`;
  }
  return safeCatalogImageUrl(profileImageUrl, supabaseOrigin);
}
