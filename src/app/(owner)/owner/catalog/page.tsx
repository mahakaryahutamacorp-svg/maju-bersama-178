"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOwnerStoreScope } from "@/components/owner/owner-store-scope";
import { formatRp } from "@/lib/mb178/format";

/* ──────────────────── Types ──────────────────── */

interface CatalogMeta {
  key: string;
  label: string;
  count: number;
}

interface CatalogItem {
  id: string;
  category: string;
  sub_category?: string;
  brand_name: string;
  product_name: string;
  description: string;
  default_unit: string;
  suggested_price_min?: number | null;
  suggested_price_max?: number | null;
  image_url?: string | null;
  // pertanian-specific
  active_ingredients?: string;
  formulation?: string;
  // elektronik-specific
  specifications?: string;
}

/* ──────────────────── Catalog Picker ──────────────────── */

function CatalogPicker({
  catalogs,
  selected,
  onSelect,
}: {
  catalogs: CatalogMeta[];
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {catalogs.map((c) => {
        const active = selected === c.key;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onSelect(c.key)}
            className={`rounded-xl border p-3 text-left transition ${
              active
                ? "border-amber-500/40 bg-amber-500/10"
                : "border-white/10 bg-white/[0.03] hover:border-white/20"
            }`}
          >
            <p className={`text-sm font-medium ${active ? "text-amber-200" : "text-zinc-300"}`}>
              {c.label}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-600">
              {c.count} produk
            </p>
          </button>
        );
      })}
    </div>
  );
}

/* ──────────────────── Catalog Item Card ──────────────────── */

function CatalogItemCard({
  item,
  onImport,
  importing,
}: {
  item: CatalogItem;
  onImport: (item: CatalogItem) => void;
  importing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const priceHint = useMemo(() => {
    const min = item.suggested_price_min;
    const max = item.suggested_price_max;
    if (min && max) return `${formatRp(min)} — ${formatRp(max)}`;
    if (min) return `mulai ${formatRp(min)}`;
    if (max) return `s/d ${formatRp(max)}`;
    return null;
  }, [item.suggested_price_min, item.suggested_price_max]);

  return (
    <li className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition hover:bg-white/[0.05]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-100">{item.product_name}</p>
          <p className="mt-0.5 text-xs text-amber-200/70">{item.brand_name}</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <span className="inline-block rounded-full border border-zinc-700 bg-zinc-800/50 px-2 py-0.5 text-[10px] text-zinc-500">
              {item.category}
            </span>
            {item.sub_category ? (
              <span className="inline-block rounded-full border border-zinc-700 bg-zinc-800/50 px-2 py-0.5 text-[10px] text-zinc-500">
                {item.sub_category}
              </span>
            ) : null}
            <span className="inline-block rounded-full border border-zinc-700 bg-zinc-800/50 px-2 py-0.5 text-[10px] text-zinc-500">
              {item.default_unit}
            </span>
          </div>
          {priceHint ? (
            <p className="mt-1.5 text-xs text-zinc-500">Harga pasaran: {priceHint}</p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={importing}
          onClick={() => onImport(item)}
          className="shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-40"
        >
          {importing ? "…" : "Impor"}
        </button>
      </div>

      {/* Toggle description */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-[11px] text-zinc-600 underline-offset-2 hover:text-zinc-400 hover:underline"
      >
        {expanded ? "Sembunyikan detail" : "Lihat detail"}
      </button>
      {expanded ? (
        <div className="mt-2 space-y-2 border-t border-zinc-800 pt-2 text-xs text-zinc-400">
          <p className="whitespace-pre-wrap leading-relaxed">{item.description}</p>
          {item.active_ingredients ? (
            <p>
              <span className="text-zinc-600">Bahan aktif: </span>
              {item.active_ingredients}
            </p>
          ) : null}
          {item.specifications ? (
            <p>
              <span className="text-zinc-600">Spesifikasi: </span>
              {item.specifications}
            </p>
          ) : null}
          {item.formulation ? (
            <p>
              <span className="text-zinc-600">Formulasi: </span>
              {item.formulation}
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

/* ──────────────────── Main Page ──────────────────── */

export default function MasterCatalogPage() {
  const { appendApiUrl, ready } = useOwnerStoreScope();
  const router = useRouter();

  const [catalogs, setCatalogs] = useState<CatalogMeta[]>([]);
  const [selectedCatalog, setSelectedCatalog] = useState<string | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* Load catalog list */
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      setLoadingCatalogs(true);
      try {
        const res = await fetch(appendApiUrl("/api/owner/master-catalog"));
        const json = (await res.json()) as { catalogs?: CatalogMeta[] };
        if (!cancelled) setCatalogs(json.catalogs ?? []);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoadingCatalogs(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ready, appendApiUrl]);

  /* Load items when catalog or search changes */
  useEffect(() => {
    if (!ready || !selectedCatalog) {
      setItems([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoadingItems(true);
      setError(null);
      try {
        const params = new URLSearchParams({ catalog: selectedCatalog });
        if (searchQuery) params.set("q", searchQuery);
        const res = await fetch(appendApiUrl(`/api/owner/master-catalog?${params.toString()}`));
        const json = (await res.json()) as { items?: CatalogItem[]; error?: string };
        if (cancelled) return;
        if (!res.ok) setError(json.error ?? "Gagal memuat katalog.");
        else setItems(json.items ?? []);
      } catch {
        if (!cancelled) setError("Tidak dapat terhubung ke server.");
      } finally {
        if (!cancelled) setLoadingItems(false);
      }
    }, searchQuery ? 300 : 0); // Debounce search

    return () => { cancelled = true; clearTimeout(timer); };
  }, [ready, selectedCatalog, searchQuery, appendApiUrl]);

  /* Import: pre-fill product form and redirect to products page */
  const handleImport = useCallback(
    async (item: CatalogItem) => {
      setImportingId(item.id);
      try {
        /* POST ke products API langsung */
        const formData = new FormData();
        formData.append("name", `${item.brand_name} ${item.product_name}`);
        formData.append("price", String(item.suggested_price_min ?? 0));
        formData.append("stock", "0");
        formData.append("unit", item.default_unit);
        formData.append("description", item.description);
        formData.append("category", item.category);

        const res = await fetch(appendApiUrl("/api/owner/products"), {
          method: "POST",
          body: formData,
        });
        const json = (await res.json()) as { product?: { id: string }; error?: string };

        if (!res.ok) {
          setToast(`Gagal: ${json.error ?? "Error"}`);
        } else {
          setToast(`✓ "${item.product_name}" berhasil diimpor!`);
          /* Redirect ke halaman produk setelah 1.5 detik */
          setTimeout(() => router.push("/owner/products"), 1500);
        }
      } catch {
        setToast("Gagal mengimpor produk.");
      } finally {
        setImportingId(null);
        setTimeout(() => setToast(null), 3000);
      }
    },
    [appendApiUrl, router],
  );

  /* Group items by category */
  const groupedItems = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();
    for (const item of items) {
      const cat = item.category;
      const arr = map.get(cat) ?? [];
      arr.push(item);
      map.set(cat, arr);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
    <div className="px-4 py-8 md:mx-auto md:max-w-lg">
      <h1 className="font-serif text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
        Katalog Master
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Pilih produk dari katalog referensi, lalu impor langsung ke toko Anda. Harga dan stok bisa diedit setelah impor.
      </p>

      {/* Toast */}
      {toast ? (
        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-200" role="status">
          {toast}
        </div>
      ) : null}

      {/* Catalog picker */}
      <div className="mt-6">
        {loadingCatalogs ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]" />
            ))}
          </div>
        ) : catalogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 py-8 text-center">
            <p className="text-sm text-zinc-500">
              Tidak ada tabel master catalog di database. Jalankan SQL seed{" "}
              <code className="text-zinc-400">supabase/05-*.sql</code> s/d{" "}
              <code className="text-zinc-400">11-*.sql</code>.
            </p>
          </div>
        ) : (
          <CatalogPicker
            catalogs={catalogs}
            selected={selectedCatalog}
            onSelect={setSelectedCatalog}
          />
        )}
      </div>

      {/* Search */}
      {selectedCatalog ? (
        <div className="mt-4">
          <input
            type="search"
            placeholder="Cari produk di katalog…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-500/40"
          />
        </div>
      ) : null}

      {/* Items list */}
      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-950/20 p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      ) : loadingItems ? (
        <div className="mt-6 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />
          ))}
        </div>
      ) : selectedCatalog && items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-700 py-10 text-center">
          <p className="text-sm text-zinc-500">
            {searchQuery
              ? `Tidak ditemukan produk untuk "${searchQuery}".`
              : "Katalog ini kosong."}
          </p>
        </div>
      ) : groupedItems.length > 0 ? (
        <div className="mt-6 space-y-6">
          {groupedItems.map(([category, catItems]) => (
            <section key={category}>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                {category} · {catItems.length} produk
              </h2>
              <ul className="space-y-2">
                {catItems.map((item) => (
                  <CatalogItemCard
                    key={item.id}
                    item={item}
                    onImport={handleImport}
                    importing={importingId === item.id}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
