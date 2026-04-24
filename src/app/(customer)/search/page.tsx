"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { formatRp } from "@/lib/mb178/format";
import { safeCatalogImageUrl } from "@/lib/mb178/safe-remote-image";
import { ProductSkeleton } from "@/components/ui/Skeleton";

interface SearchResult {
  id: string;
  name: string;
  price: number;
  category: string | null;
  image_url: string | null;
  store: {
    name: string;
    slug: string;
  };
}

export default function GlobalSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        setResults(json.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="px-4 py-10 md:mx-auto md:max-w-lg">
      <h1 className="font-serif text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
        Cari Produk
      </h1>
      
      <div className="mt-6 relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          autoFocus
          placeholder="Cari pupuk, alat, pestisida..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-500/40"
        />
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : query.length >= 2 && results.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 py-10">
            Produk &quot;{query}&quot; tidak ditemukan di toko manapun.
          </p>
        ) : (
          <ul className="space-y-4">
            {results.map((r) => (
              <li key={r.id} className="group">
                <Link
                  href={`/store/${r.store.slug}`}
                  className="flex gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition hover:bg-white/[0.04]"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/5 bg-zinc-900">
                    {r.image_url ? (
                      <Image
                        src={safeCatalogImageUrl(r.image_url, supabaseOrigin)}
                        alt={r.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-zinc-700">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <p className="text-sm font-medium text-zinc-100 truncate group-hover:text-amber-200 transition">
                      {r.name}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-amber-200/80">
                      {formatRp(r.price)}
                    </p>
                    <p className="mt-1.5 text-[10px] text-zinc-500">
                      Tersedia di <span className="text-zinc-400 font-medium">{r.store.name}</span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
