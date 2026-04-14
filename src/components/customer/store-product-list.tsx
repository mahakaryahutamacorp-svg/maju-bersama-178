"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { addOrMergeCartLine } from "@/lib/mb178/cart-storage";

export interface StoreCatalogProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  imageSrc: string | null;
  description: string | null;
}

function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

interface Props {
  products: StoreCatalogProduct[];
  storeContext: { storeId: string; storeSlug: string };
}

export function StoreProductList({ products, storeContext }: Props) {
  const [openDescriptions, setOpenDescriptions] = useState<Record<string, boolean>>(
    {},
  );
  const [toastId, setToastId] = useState<string | null>(null);

  const toggleDescription = useCallback((id: string) => {
    setOpenDescriptions((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const addToCart = useCallback(
    (p: StoreCatalogProduct) => {
      if (p.stock < 1) return;
      addOrMergeCartLine({
        productId: p.id,
        storeId: storeContext.storeId,
        storeSlug: storeContext.storeSlug,
        name: p.name,
        unit: p.unit || "pcs",
        price: p.price,
        qty: 1,
        imageUrl: p.imageSrc,
      });
      setToastId(p.id);
      window.setTimeout(() => setToastId((cur) => (cur === p.id ? null : cur)), 2000);
    },
    [storeContext.storeId, storeContext.storeSlug],
  );

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-700 py-12 text-center text-sm text-zinc-500">
        Belum ada produk di katalog.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {products.map((p) => {
        const expanded = !!openDescriptions[p.id];
        const hasText = Boolean(p.description?.trim());

        return (
          <li
            key={p.id}
            className="rounded-2xl border border-yellow-600/10 bg-zinc-900/35 p-4"
          >
            <div className="flex gap-4">
              <button
                type="button"
                className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-amber-500/15 bg-zinc-800 text-left outline-none ring-amber-500/40 transition hover:border-amber-500/35 focus-visible:ring-2"
                onClick={() => toggleDescription(p.id)}
                aria-expanded={expanded ? "true" : "false"}
                aria-label={
                  hasText
                    ? expanded
                      ? "Sembunyikan deskripsi produk"
                      : "Tampilkan deskripsi produk"
                    : expanded
                      ? "Tutup informasi produk"
                      : "Lihat informasi produk"
                }
              >
                {p.imageSrc ? (
                  <Image
                    src={p.imageSrc}
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
              </button>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="font-medium text-zinc-100">{p.name}</p>
                <p className="mt-1 text-amber-200/90">{formatRp(p.price)}</p>
                <p className="text-xs text-zinc-500">Stok: {p.stock}</p>
                <p className="mt-2 text-xs text-zinc-600">
                  Ketuk gambar untuk deskripsi
                </p>
                <button
                  type="button"
                  disabled={p.stock < 1}
                  onClick={() => addToCart(p)}
                  className="mt-3 w-full rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200/95 transition hover:border-amber-400/50 hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {p.stock < 1 ? "Stok habis" : "Tambah ke keranjang"}
                </button>
                {toastId === p.id ? (
                  <p className="mt-1 text-center text-[11px] text-emerald-400/90" role="status">
                    Ditambahkan ke keranjang
                  </p>
                ) : null}
              </div>
            </div>
            {expanded ? (
              <div className="mt-4 border-t border-zinc-800 pt-4">
                {hasText ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                    {p.description}
                  </p>
                ) : (
                  <p className="text-sm text-zinc-500">Belum ada deskripsi.</p>
                )}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
