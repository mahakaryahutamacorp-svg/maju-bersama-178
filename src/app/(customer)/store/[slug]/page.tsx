import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StoreProductList } from "@/components/customer/store-product-list";
import { buttonClass } from "@/components/ui/Button";
import { resolveStoreFrontImage } from "@/lib/mb178/local-store-images";
import { safeCatalogImageUrl } from "@/lib/mb178/safe-remote-image";
import { createSupabaseServerComponentClient } from "@/lib/supabase/ssr";
import type { Mb178ProductRow } from "@/lib/mb178/types";
import type { Mb178StoreRow } from "@/lib/mb178/types";

type Props = { params: Promise<{ slug: string }> };

export default async function StoreCatalogPage({ params }: Props) {
  const { slug } = await params;
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabase = await createSupabaseServerComponentClient();

  if (!supabase) {
    return (
      <div className="px-4 py-10 text-center">
        <h1 className="font-serif text-2xl text-amber-200/90">Toko</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Katalog membutuhkan konfigurasi Supabase (env).
        </p>
      </div>
    );
  }

  const { data: store, error: storeErr } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (storeErr || !store) {
    notFound();
  }

  const row = store as Mb178StoreRow;

  let prodQuery = supabase
    .from("products")
    .select("*")
    .eq("store_id", row.id);

  if (row.hide_zero_stock_from_catalog) {
    prodQuery = prodQuery.gt("stock", 0);
  }

  const { data: products, error: prodErr } = await prodQuery.order(
    "created_at",
    { ascending: false }
  );

  if (prodErr) {
    return (
      <div className="px-4 py-10">
        <h1 className="font-serif text-2xl text-amber-200/90">{row.name}</h1>
        <p className="mt-2 text-sm text-red-300/90">{prodErr.message}</p>
      </div>
    );
  }

  const list = (products ?? []) as Mb178ProductRow[];
  const catalogItems = list.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    unit: p.unit || "pcs",
    description: p.description ?? null,
    imageSrc: p.image_url
      ? safeCatalogImageUrl(p.image_url, supabaseOrigin)
      : null,
  }));
  const wa = row.whatsapp_link?.trim();
  const coverSrc = resolveStoreFrontImage(
    slug,
    row.profile_image_url,
    supabaseOrigin
  );

  return (
    <div className="px-4 pb-24 pt-8 md:mx-auto md:max-w-lg">
      <Link
        href="/"
        className="text-sm text-amber-500/90 underline-offset-4 hover:underline"
      >
        ← Beranda
      </Link>
      <header className="mt-6">
        <div className="relative mb-6 aspect-[16/10] w-full max-w-lg overflow-hidden rounded-2xl border border-amber-500/20 shadow-[0_0_32px_rgba(212,175,55,0.08)]">
          <Image
            src={coverSrc}
            alt={row.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 512px"
            priority
          />
        </div>
        <h1 className="font-serif text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">
          {row.name}
        </h1>
        {row.address ? (
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {row.address}
          </p>
        ) : null}
        {wa ? (
          <a
            href={wa.startsWith("http") ? wa : `https://wa.me/${wa.replace(/\D/g, "")}`}
            className={`${buttonClass("whatsapp")} mt-6 inline-flex w-full max-w-sm justify-center text-center`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        ) : null}
      </header>

      <section className="mt-10">
        <h2 className="mb-4 font-serif text-lg text-zinc-300">Katalog</h2>
        <StoreProductList
          products={catalogItems}
          storeContext={{ storeId: row.id, storeSlug: slug }}
        />
      </section>
    </div>
  );
}
