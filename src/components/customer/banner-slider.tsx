"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export interface BannerSlideItem {
  id: string;
  imageUrl: string;
  title: string | null;
}

const INTERVAL_MS = 6000;

export function BannerSlider({ items }: { items: BannerSlideItem[] }) {
  const [index, setIndex] = useState(0);
  const count = items.length;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (count <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [count]);

  if (count === 0) return null;

  return (
    <section
      className="relative mb-8 overflow-hidden rounded-3xl border border-amber-500/25 bg-zinc-950/80 shadow-[0_0_48px_rgba(212,175,55,0.12)] backdrop-blur-md"
      aria-roledescription="carousel"
      aria-label="Promo dan banner"
    >
      <div className="relative aspect-[21/9] w-full min-h-[140px] sm:aspect-[2.4/1] sm:min-h-[180px]">
        {items.map((item, i) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${i === index ? "z-[1] opacity-100" : "z-0 opacity-0 pointer-events-none"
              }`}
            {...(i === index ? {} : { "aria-hidden": true as const })}
          >
            <Image
              src={item.imageUrl}
              alt={item.title?.trim() || "Banner promosi"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 896px"
              priority={i === 0}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            {item.title?.trim() ? (
              <p className="pointer-events-none absolute bottom-4 left-4 right-4 font-serif text-lg font-semibold tracking-wide text-white drop-shadow-md md:text-xl">
                {item.title.trim()}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {count > 1 ? (
        <>
          <div className="absolute bottom-3 left-0 right-0 z-[2] flex justify-center gap-1.5">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Banner ${i + 1} dari ${count}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all duration-300 ${i === index
                    ? "w-8 bg-gradient-to-r from-amber-400 to-yellow-500"
                    : "w-2 bg-white/25 hover:bg-white/40"
                  }`}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Banner sebelumnya"
            className="absolute left-2 top-1/2 z-[2] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-amber-500/30 bg-zinc-950/70 text-amber-200/90 shadow-lg backdrop-blur-sm transition hover:border-amber-400/50 hover:bg-zinc-900/90 sm:flex"
            onClick={() => go(index - 1)}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Banner berikutnya"
            className="absolute right-2 top-1/2 z-[2] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-amber-500/30 bg-zinc-950/70 text-amber-200/90 shadow-lg backdrop-blur-sm transition hover:border-amber-400/50 hover:bg-zinc-900/90 sm:flex"
            onClick={() => go(index + 1)}
          >
            ›
          </button>
        </>
      ) : null}
    </section>
  );
}
