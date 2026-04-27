"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
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
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollAmount = useMemo(() => {
    // ~1-2 cards per click depending on viewport.
    return 560;
  }, []);

  const scrollBy = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const delta = direction === "left" ? -scrollAmount : scrollAmount;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold tracking-tight text-zinc-200 md:text-xl">
            Pilih Toko
          </h2>
          <p className="mt-0.5 text-[10px] text-zinc-500 md:text-xs">
            Geser untuk melihat toko lainnya.
          </p>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollBy("left")}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-yellow-500/30 hover:bg-white/10"
            aria-label="Geser toko ke kiri"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollBy("right")}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-yellow-500/30 hover:bg-white/10"
            aria-label="Geser toko ke kanan"
          >
            →
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-zinc-950 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-zinc-950 to-transparent" />

        <div
          ref={scrollerRef}
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:gap-6"
        >
          {stores.map((store) => (
            <div
              key={store.slug}
              className="w-[72vw] shrink-0 snap-start sm:w-[320px] md:w-[340px]"
            >
              <Card
                title={store.name}
                imageSrc={resolveStoreFrontImage(store.slug, store.image, supabaseOrigin)}
                imageAlt={`Toko ${store.name}`}
                darkened={false}
                operationalStatus="open"
                description="Belanja per katalog, chat cepat via WhatsApp."
              >
                <div className="flex gap-2">
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
      </div>
    </section>
  );
}

