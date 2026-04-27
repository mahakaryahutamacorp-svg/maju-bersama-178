import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/Button";
import { resolveStoreFrontImage } from "@/lib/mb178/local-store-images";

export interface StorePickGridItem {
  slug: string;
  name: string;
  whatsapp: string;
  image: string | null;
}

interface StorePickGridProps {
  stores: StorePickGridItem[];
  supabaseOrigin?: string;
}

const DEFAULT_STORE_BLURB = "Belanja per katalog, chat cepat via WhatsApp.";

/** Grid statis toko: 2 kolom mobile, bertahap ke 3–5 kolom di layar lebar agar kartu tidak membesar tidak wajar. */
export function StorePickGrid({ stores, supabaseOrigin }: StorePickGridProps) {
  return (
    <section className="mt-8 md:mt-10 lg:mt-12">
      <div className="mb-3 md:mb-4">
        <h2 className="font-serif text-lg font-semibold tracking-tight text-zinc-200 md:text-xl lg:text-2xl">
          Pilih Toko
        </h2>
        <p className="mt-0.5 text-[10px] text-zinc-500 md:text-xs">Semua toko mitra dalam satu layar.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5">
        {stores.map((store) => (
          <div key={store.slug} className="min-w-0">
            <Card
              title={store.name}
              imageSrc={resolveStoreFrontImage(store.slug, store.image, supabaseOrigin)}
              imageAlt={`Toko ${store.name}`}
              darkened={false}
              operationalStatus="open"
              description={DEFAULT_STORE_BLURB}
            >
              <div className="flex gap-2">
                <Link
                  href={`/store/${store.slug}`}
                  className={`${buttonClass("toko")} h-9 flex-1 text-[11px] font-bold sm:h-11 sm:text-sm`}
                >
                  Toko
                </Link>
                {store.whatsapp ? (
                  <a
                    className={`${buttonClass("whatsapp")} h-9 flex-1 text-[11px] font-bold sm:h-11 sm:text-sm`}
                    href={`https://wa.me/${store.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </a>
                ) : (
                  <span
                    className={`${buttonClass("ghost")} h-9 flex-1 cursor-not-allowed text-[11px] font-bold opacity-50 sm:h-11 sm:text-sm`}
                  >
                    WhatsApp
                  </span>
                )}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </section>
  );
}
