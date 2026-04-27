"use client";

import Image from "next/image";

export interface RecommendedProductMiniItem {
  id: string;
  name: string;
  priceLabel: string;
  storeName: string;
  imageSrc: string | null;
}

interface RecommendedProductMiniStripProps {
  products: RecommendedProductMiniItem[];
}

/**
 * Strip horizontal produk rekomendasi — kartu sangat ringkas (~30–40% jejak kartu grid utama),
 * digulir horizontal; lebar kartu diset agar sebagian kartu berikutnya tampak di tepi kanan.
 */
export function RecommendedProductMiniStrip({ products }: RecommendedProductMiniStripProps) {
  return (
    <div
      className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto overflow-y-hidden px-4 pb-1 pt-0.5 no-scrollbar"
      role="region"
      aria-label="Rekomendasi produk, gulir horizontal"
    >
      {products.map((p) => (
        <article
          key={p.id}
          className="w-[min(44vw,132px)] shrink-0 snap-start overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60 shadow-[0_4px_16px_rgba(0,0,0,0.45)] backdrop-blur-sm"
        >
          <div className="relative h-[52px] w-full overflow-hidden bg-zinc-950">
            {p.imageSrc ? (
              <Image
                src={p.imageSrc}
                alt={p.name}
                fill
                className="object-cover brightness-95"
                sizes="132px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[8px] text-zinc-600">Tanpa foto</div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="space-y-0.5 px-1.5 py-1.5">
            <p className="line-clamp-2 min-h-[1.75rem] text-[8px] font-semibold leading-tight text-zinc-100">
              {p.name}
            </p>
            <p className="text-[9px] font-bold leading-none text-[#D4AF37]">{p.priceLabel}</p>
            <p className="line-clamp-1 text-[7px] leading-tight text-zinc-500">{p.storeName}</p>
          </div>
        </article>
      ))}
      {/* Spacer ringan agar kartu terakhir tidak menempel tepi dan scroll terasa natural */}
      <div className="w-1 shrink-0 snap-end" aria-hidden />
    </div>
  );
}
