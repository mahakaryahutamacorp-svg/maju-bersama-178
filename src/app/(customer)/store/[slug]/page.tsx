import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClass } from "@/components/ui/Button";
import { createMb178Client } from "@/lib/supabase/admin";
import type { Mb178ProductRow } from "@/lib/mb178/types";
import type { Mb178StoreRow } from "@/lib/mb178/types";

type Props = { params: Promise<{ slug: string }> };

function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function StoreCatalogPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createMb178Client();

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
  const wa = row.whatsapp_link?.trim();

  return (
    <div className="px-4 pb-24 pt-8 md:mx-auto md:max-w-lg">
      <Link
        href="/"
        className="text-sm text-amber-500/90 underline-offset-4 hover:underline"
      >
        ← Beranda
      </Link>
      <header className="mt-6">
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
        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-700 py-12 text-center text-sm text-zinc-500">
            Belum ada produk di katalog.
          </p>
        ) : (
          <ul className="space-y-4">
            {list.map((p) => (
              <li
                key={p.id}
                className="flex gap-4 rounded-2xl border border-yellow-600/10 bg-zinc-900/35 p-4"
              >
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-amber-500/15 bg-zinc-800">
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center px-2 text-center text-xs text-zinc-600">
                      {p.name}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-100">{p.name}</p>
                  <p className="mt-1 text-amber-200/90">{formatRp(p.price)}</p>
                  <p className="text-xs text-zinc-500">Stok: {p.stock}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
