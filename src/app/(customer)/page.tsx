import Link from "next/link";
import { BannerSlider } from "@/components/customer/banner-slider";
import { Card } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/Button";
import { resolveStoreCardImage } from "@/lib/mb178/local-store-images";
import type { Mb178StoreRow } from "@/lib/mb178/types";
import { createMb178Client } from "@/lib/supabase/admin";

export default async function CustomerHomePage() {
  const stores: { slug: string; name: string; whatsapp: string; image: string | null }[] = [];
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const supabase = createMb178Client();
  if (supabase) {
    const { data } = await supabase
      .from("stores")
      .select("slug, name, whatsapp_link, profile_image_url")
      .order("created_at", { ascending: true });

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
  }

  return (
    <div className="px-4 pb-8 pt-8 md:mx-auto md:max-w-4xl">
      <header className="mb-8">
        <div className="text-center">
          <p className="font-serif text-3xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 md:text-4xl">
            Maju Bersama 178
          </p>
          <p className="mt-2 font-serif text-lg text-zinc-400 md:text-xl">
            Pilih Toko
          </p>
        </div>
      </header>

      <BannerSlider />

      {stores.length === 0 ? (
        <p className="rounded-3xl border border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-zinc-400">
          Belum ada toko di katalog. Pastikan variabel lingkungan Supabase terisi, lalu jalankan skrip{" "}
          <code className="text-zinc-300">supabase/setup-complete.sql</code> di Supabase SQL Editor.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {stores.map((store) => (
            <Card
              key={store.slug}
              title={store.name}
              imageSrc={resolveStoreCardImage(
                store.slug,
                store.image,
                supabaseOrigin,
              )}
              imageAlt={`Toko ${store.name}`}
              darkened={false}
            >
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/store/${store.slug}`}
                  className={`${buttonClass("toko")} flex-1 text-center`}
                >
                  Toko
                </Link>
                {store.whatsapp && (
                  <a
                    className={`${buttonClass("whatsapp")} flex-1 text-center`}
                    href={`https://wa.me/${store.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
