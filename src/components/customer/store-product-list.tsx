"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { addOrMergeCartLine } from "@/lib/mb178/cart-storage";
import { formatRp } from "@/lib/mb178/format";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export interface StoreCatalogProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  category?: string | null;
  imageSrc: string | null;
  description: string | null;
}

interface Props {
  products: StoreCatalogProduct[];
  storeContext: { storeId: string; storeSlug: string };
}

export function StoreProductList({ products, storeContext }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [openDescriptions, setOpenDescriptions] = useState<Record<string, boolean>>({});
  const [toastId, setToastId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add("Semua");
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "Semua" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

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

  return (
    <div className="space-y-6">
      {/* Search & Filter UI */}
      <div className="sticky top-[52px] z-20 -mx-4 bg-zinc-950/80 px-4 pb-4 pt-2 backdrop-blur-md">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            placeholder="Cari produk di toko ini…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-500/40"
          />
        </div>

        {categories.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                  selectedCategory === cat
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-800 py-16 text-center">
          <p className="text-sm text-zinc-500">
            {searchQuery || selectedCategory !== "Semua"
              ? "Produk tidak ditemukan."
              : "Belum ada produk di katalog."}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredProducts.map((p) => {
            const expanded = !!openDescriptions[p.id];
            const hasText = Boolean(p.description?.trim());

            return (
              <li
                key={p.id}
                className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 transition hover:bg-white/[0.04]"
              >
                <div className="flex gap-4">
                  <button
                    type="button"
                    className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-white/5 bg-zinc-900 text-left outline-none transition hover:border-amber-500/20"
                    onClick={() => toggleDescription(p.id)}
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
                      <span className="flex h-full items-center justify-center px-2 text-center text-[10px] text-zinc-700">
                        Tanpa Foto
                      </span>
                    )}
                  </button>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-zinc-100">{p.name}</p>
                    <p className="mt-1 text-sm font-semibold text-amber-200/90">{formatRp(p.price)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500">Stok: {p.stock} {p.unit}</span>
                      {p.category && (
                        <span className="rounded-full bg-zinc-800/50 px-2 py-0.5 text-[9px] text-zinc-600">
                          {p.category}
                        </span>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      disabled={p.stock < 1}
                      onClick={() => addToCart(p)}
                      className="mt-3 w-full rounded-xl border border-amber-500/30 bg-amber-500/10 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-40"
                    >
                      {p.stock < 1 ? "Stok Habis" : "Tambah ke Keranjang"}
                    </button>
                    {toastId === p.id && (
                      <p className="mt-1 text-center text-[10px] text-emerald-400 animate-pulse">
                        Ditambahkan!
                      </p>
                    )}
                  </div>
                </div>
                {expanded && (
                  <div className="mt-4 border-t border-white/5 pt-4 text-xs leading-relaxed text-zinc-400">
                    {hasText ? p.description : "Tidak ada deskripsi produk."}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

