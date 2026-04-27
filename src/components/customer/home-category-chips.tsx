"use client";

import { useMemo, useState } from "react";

interface HomeCategoryChipsProps {
  categories?: string[];
}

export function HomeCategoryChips({
  categories,
}: HomeCategoryChipsProps) {
  const items = useMemo(
    () =>
      categories?.length
        ? categories
        : [
          "Semua",
          "Pertanian",
          "Klinik & Kesehatan",
          "Elektronik & Gadget",
          "Layanan Jasa",
          "Kuliner",
        ],
    [categories]
  );

  const [active, setActive] = useState(items[0] ?? "Semua");

  return (
    <div className="mt-3">
      <div className="mx-auto w-full max-w-md md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
        <div
          className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
          aria-label="Kategori toko"
        >
          {items.map((label) => {
            const selected = label === active;
            return (
              <button
                key={label}
                type="button"
                data-active={selected ? "true" : "false"}
                onClick={() => setActive(label)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition sm:text-sm ${selected
                    ? "border-amber-400 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-zinc-950 shadow-[0_0_18px_rgba(234,179,8,0.22)]"
                    : "border-amber-500/30 bg-transparent text-zinc-200/90 hover:border-amber-400/50 hover:bg-white/5"
                  }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

