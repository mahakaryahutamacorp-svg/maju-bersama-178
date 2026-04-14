"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { upsertCartLine } from "@/lib/mb178/cart-storage";

export interface StoreCatalogProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  imageSrc: string | null;
  description: string | null;
}

export interface StoreCatalogMeta {
  storeId: string;
  storeSlug: string;
  storeName: string;
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
  storeMeta?: StoreCatalogMeta | null;
}

export function StoreProductList({ products, storeMeta }: Props) {
  const { user } = useAuth();
  const [openDescriptions, setOpenDescriptions] = useState<Record<string, boolean>>(
    {},
  );
  const [cartHint, setCartHint] = useState<string | null>(null);
  const hintTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current);
    };
  }, []);

  const toggleDescription = useCallback((id: string) => {
    setOpenDescriptions((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const addToCart = useCallback(
    (p: StoreCatalogProduct) => {
      if (!storeMeta) return;
      if (p.stock < 1) {
        setCartHint("Stok habis.");
        if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current);
        hintTimerRef.current = window.setTimeout(() => {
          hintTimerRef.current = null;
          setCartHint(null);
        }, 2000);
        return;
      }
      upsertCartLine({
        store_id: storeMeta.storeId,
        store_slug: storeMeta.storeSlug,
        store_name: storeMeta.storeName,
        product_id: p.id,
        name: p.name,
        unit: p.unit || "pcs",
        price: p.price,
        qty: 1,
      });
      setCartHint("Ditambahkan ke keranjang.");
      if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current);
      hintTimerRef.current = window.setTimeout(() => {
        hintTimerRef.current = null;
        setCartHint(null);
      }, 2000);
    },
    [storeMeta]
  );

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-700 py-12 text-center text-sm text-zinc-500">
        Belum ada produk di katalog.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {cartHint ? (
        <p
          className="rounded-xl border border-amber-500/30 bg-amber-950/40 px-3 py-2 text-center text-xs text-amber-100/90"
          role="status"
          aria-live="polite"
        >
          {cartHint}
        </p>
      ) : null}
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
                  {...(expanded ? { "aria-expanded": true as const } : {})}
                  aria-controls={`store-product-desc-${p.id}`}
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
                  {storeMeta ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => addToCart(p)}
                        disabled={p.stock < 1}
                        className="rounded-xl bg-amber-500/90 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        + Keranjang
                      </button>
                      {!user ? (
                        <Link
                          href={`/login?callbackUrl=/cart`}
                          className="rounded-xl border border-zinc-600 px-3 py-1.5 text-xs text-zinc-400 hover:border-amber-500/40 hover:text-amber-200/90"
                        >
                          Checkout perlu masuk
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
              <div
                id={`store-product-desc-${p.id}`}
                hidden={!expanded}
                className="mt-4 border-t border-zinc-800 pt-4"
              >
                {hasText ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                    {p.description}
                  </p>
                ) : (
                  <p className="text-sm text-zinc-500">Belum ada deskripsi.</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
