import {
  BannerSlider,
  LOCAL_BANNER_ITEMS,
  type BannerSlideItem,
} from "@/components/customer/banner-slider";
import { safeCatalogImageUrl } from "@/lib/mb178/safe-remote-image";
import { HomeSearchBar } from "@/components/customer/home-search-bar";
import { HomeCategoryChips } from "@/components/customer/home-category-chips";
import { RewardTicketPromoBanner } from "@/components/customer/reward-ticket-promo-banner";
import type { Mb178BannerRow, Mb178StoreRow } from "@/lib/mb178/types";
import { createSupabaseServerComponentClient } from "@/lib/supabase/ssr";
import {
  RecommendedProductMiniStrip,
  type RecommendedProductMiniItem,
} from "@/components/customer/recommended-product-mini-strip";
import { StorePickGrid } from "@/components/customer/store-pick-grid";

const RECOMMENDED_PRODUCTS: RecommendedProductMiniItem[] = [
  {
    id: "mock-1",
    name: "Paket Hemat — Produk Unggulan Minggu Ini dengan Nama Panjang Agar Terlihat Truncate",
    priceLabel: "Rp 75.000",
    storeName: "Rocell Gadget",
    imageSrc: "/toko_images/rocell-gadget.jpg",
  },
  {
    id: "mock-2",
    name: "Pupuk Organik Premium 1 Kg",
    priceLabel: "Rp 25.000",
    storeName: "Pupuk MajuBersama",
    imageSrc: "/toko_images/pupuk-majubersama.jpg",
  },
  {
    id: "mock-3",
    name: "Pakan Ikan Lele Super (Kemasan 500g)",
    priceLabel: "Rp 18.500",
    storeName: "Pakan PEI",
    imageSrc: "/toko_images/pakan-pei.jpg",
  },
  {
    id: "mock-4",
    name: "Seafood Frozen Mix (Mockup)",
    priceLabel: "Rp 62.000",
    storeName: "Dapurku Seafood",
    imageSrc: "/toko_images/dapurku-seafood.jpg",
  },
  {
    id: "mock-5",
    name: "Konsultasi & Treatment (Mock)",
    priceLabel: "Rp 150.000",
    storeName: "Rosaura Skin Clinic",
    imageSrc: "/toko_images/rosaura-skin-clinic.jpg",
  },
  {
    id: "mock-6",
    name: "Pestisida MBP (Mockup)",
    priceLabel: "Rp 33.000",
    storeName: "Pestisida MBP",
    imageSrc: "/toko_images/pestisida-mbp.jpg",
  },
];

export default async function CustomerHomePage() {
  const stores: { slug: string; name: string; whatsapp: string; image: string | null }[] = [];
  let bannerItems: BannerSlideItem[] = [];
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const supabase = await createSupabaseServerComponentClient();
  if (supabase) {
    const [{ data }, { data: bannerRows }] = await Promise.all([
      supabase
        .from("stores")
        .select("slug, name, whatsapp_link, profile_image_url")
        .order("created_at", { ascending: true }),
      supabase
        .from("banners")
        .select("id, image_url, title")
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
    ]);

    if (data && data.length > 0) {
      stores.push(
        ...(data as Pick<Mb178StoreRow, "slug" | "name" | "whatsapp_link" | "profile_image_url">[]).map((s) => ({
          slug: s.slug,
          name: s.name,
          whatsapp: s.whatsapp_link?.replace(/\D/g, "") ?? "",
          image: s.profile_image_url,
        }))
      );
    }

    if (bannerRows && bannerRows.length > 0) {
      bannerItems = (bannerRows as Pick<Mb178BannerRow, "id" | "image_url" | "title">[]).map(
        (b) => ({
          id: b.id,
          imageUrl: safeCatalogImageUrl(b.image_url, supabaseOrigin),
          title: b.title,
        }),
      );
    }
  }

  // Gunakan banner lokal sesuai permintaan user untuk mengganti dummy
  bannerItems = LOCAL_BANNER_ITEMS;

  return (
    <div className="px-4 pb-8 pt-8 md:mx-auto md:max-w-4xl">
      <header className="mb-6">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-yellow-400 to-amber-600 md:text-5xl">
            Maju Bersama 178
          </h1>
          <p className="mt-1 font-serif text-lg font-medium text-zinc-400 md:text-2xl">
            Pilih Toko
          </p>
          <p className="mx-auto mt-2 max-w-[280px] text-[10px] leading-relaxed text-zinc-500 md:max-w-md md:text-xs">
            Marketplace multi-toko — belanja per katalog, hubungi penjual via WhatsApp.
          </p>
          <HomeSearchBar />
          <HomeCategoryChips />
          <RewardTicketPromoBanner />
        </div>
      </header>

      <BannerSlider items={bannerItems} />

      {stores.length === 0 ? (
        <p className="rounded-3xl border border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-zinc-400">
          Belum ada toko di katalog. Pastikan variabel lingkungan Supabase terisi, lalu jalankan skrip{" "}
          <code className="text-zinc-300">supabase/00-setup-database.sql</code> di Supabase SQL Editor.
        </p>
      ) : (
        <>
          <section className="mt-8">
            <div className="mb-2">
              <h2 className="font-serif text-lg font-semibold tracking-tight text-zinc-200 md:text-xl">
                Rekomendasi Produk
              </h2>
              <p className="mt-0.5 text-[10px] text-zinc-500 md:text-xs">UI mock-up</p>
            </div>

            <RecommendedProductMiniStrip products={RECOMMENDED_PRODUCTS} />
          </section>

          <StorePickGrid stores={stores} supabaseOrigin={supabaseOrigin} />
        </>
      )}
    </div>
  );
}
