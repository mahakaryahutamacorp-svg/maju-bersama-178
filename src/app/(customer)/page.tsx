import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/Button";
import { createMb178Client } from "@/lib/supabase/admin";
import type { Mb178StoreRow } from "@/lib/mb178/types";
import { mockStores } from "@/lib/mock-stores";

export default async function CustomerHomePage() {
  let stores: { slug: string; name: string; whatsapp: string; image: string | null }[] = [];

  const supabase = createMb178Client();
  if (supabase) {
    const { data } = await supabase
      .from("stores")
      .select("slug, name, whatsapp_link, profile_image_url")
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      stores = (data as Pick<Mb178StoreRow, "slug" | "name" | "whatsapp_link" | "profile_image_url">[]).map((s) => ({
        slug: s.slug,
        name: s.name,
        whatsapp: s.whatsapp_link?.replace(/\D/g, "") ?? "",
        image: s.profile_image_url,
      }));
    }
  }

  if (stores.length === 0) {
    stores = mockStores.map((s) => ({
      slug: s.storePath.replace("/store/", ""),
      name: s.name,
      whatsapp: s.whatsappE164,
      image: s.imageSrc,
    }));
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

      <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/login?mode=customer"
          className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition hover:bg-white/10"
        >
          <p className="font-serif text-lg text-amber-200/90">Pengunjung</p>
          <p className="mt-1 text-sm text-zinc-500">
            Masuk / Daftar cepat tanpa email.
          </p>
          <div className="mt-4">
            <span className={`${buttonClass("toko")} inline-flex w-auto px-5`}>
              Masuk / Daftar
            </span>
          </div>
        </Link>
        <Link
          href="/login?mode=owner"
          className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-zinc-900/70 to-zinc-950/90 p-5 shadow-[0_0_40px_rgba(212,175,55,0.10)] transition hover:border-amber-400/40"
        >
          <p className="font-serif text-lg text-amber-200/90">Admin Toko</p>
          <p className="mt-1 text-sm text-zinc-500">
            Masuk untuk kelola produk, pesanan, dan pengaturan toko.
          </p>
          <div className="mt-4">
            <span className={`${buttonClass("ghost")} inline-flex w-auto px-5`}>
              Masuk Admin
            </span>
          </div>
        </Link>
      </section>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {stores.map((store) => (
          <Card
            key={store.slug}
            title={store.name}
            imageSrc={store.image ?? "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80"}
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
    </div>
  );
}
