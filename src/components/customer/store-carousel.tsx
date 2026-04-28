"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/Button";
import { resolveStoreFrontImage } from "@/lib/mb178/local-store-images";

interface StoreCarouselStore {
  slug: string;
  name: string;
  whatsapp: string;
  image: string | null;
}

interface Props {
  stores: StoreCarouselStore[];
  supabaseOrigin?: string;
}

export function StoreCarousel({ stores, supabaseOrigin }: Props) {
  return (
    <section className="mt-8">
      <div className="mb-3">
        <div>
          <h2 className="font-serif text-lg font-semibold tracking-tight text-zinc-200 md:text-xl">
            Pilih Toko
          </h2>
          <p className="mt-0.5 text-[10px] text-zinc-500 md:text-xs">
            Tampilan grid dua kolom untuk akses cepat ke toko.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {stores.map((store) => (
          <div key={store.slug} className="min-w-0">
            <Card
              title={store.name}
              imageSrc={resolveStoreFrontImage(store.slug, store.image, supabaseOrigin)}
              imageAlt={`Toko ${store.name}`}
              darkened={false}
              operationalStatus="open"
              description="Belanja per katalog, chat cepat via WhatsApp."
            >
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/store/${store.slug}`}
                  className={`${buttonClass("toko")} h-9 flex-1 text-[11px] font-bold sm:h-11 sm:text-sm`}
                >
                  Toko
                </Link>
                {store.whatsapp && (
                  <a
                    className={`${buttonClass("whatsapp")} h-9 flex-1 text-[11px] font-bold sm:h-11 sm:text-sm`}
                    href={`https://wa.me/${store.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </section>
  );
}
