"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatRp } from "@/lib/mb178/format";
import {
  CubeIcon,
  WalletIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { OwnerRadar } from "@/components/owner/owner-radar";
import { useOwnerStoreScope } from "@/components/owner/owner-store-scope";
import { useAuth } from "@/components/providers/auth-provider";

const menuItems = [
  {
    href: "/owner/products",
    label: "Edit Produk Saya",
    Icon: PencilSquareIcon,
  },
  {
    href: "/owner/orders",
    label: "Kelola Pesanan",
    Icon: ClipboardDocumentListIcon,
  },
  {
    href: "/owner/reports/finance",
    label: "Laporan Keuangan",
    Icon: ChartBarIcon,
  },
  {
    href: "/settings",
    label: "Pengaturan Toko",
    Icon: Cog6ToothIcon,
  },
];

type Stats = {
  totalProducts: number;
  totalStock: number;
  orderCount: number;
  revenue: number;
  rating05: number;
  radar: { stok: number; pesanan: number; rating: number };
};



export default function OwnerDashboardPage() {
  const { user, loading, isOwner } = useAuth();
  const { appendApiUrl, ready: storeReady } = useOwnerStoreScope();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user || !isOwner || !storeReady) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(appendApiUrl("/api/owner/dashboard-stats"));
        const json = (await res.json()) as Partial<Stats> & {
          error?: string;
          hint?: string | null;
        };
        if (!res.ok) {
          const msg =
            [json.error, json.hint].filter(Boolean).join(" — ") ||
            "Gagal memuat statistik";
          if (!cancelled) setLoadError(msg);
          return;
        }
        if (!cancelled) {
          setLoadError(null);
          setStats({
            totalProducts: json.totalProducts ?? 0,
            totalStock: json.totalStock ?? 0,
            orderCount: json.orderCount ?? 0,
            revenue: json.revenue ?? 0,
            rating05: json.rating05 ?? 4.5,
            radar: json.radar ?? { stok: 0, pesanan: 0, rating: 0 },
          });
        }
      } catch {
        if (!cancelled) setLoadError("Gagal memuat statistik");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user, isOwner, storeReady, appendApiUrl]);

  if (loading) {
    return (
      <div className="px-4 py-16 text-center text-sm text-zinc-500">
        Memuat…
      </div>
    );
  }

  if (!user || !isOwner) {
    return null;
  }

  if (!storeReady) {
    return (
      <div className="px-4 py-16 text-center text-sm text-zinc-500">
        Memuat konteks toko…
      </div>
    );
  }

  const radar = stats?.radar;
  const totalProducts = stats?.totalProducts;
  const revenue = stats?.revenue;
  const metricsReady = stats !== null;

  return (
    <div className="px-4 md:mx-auto md:max-w-lg">
      {loadError ? (
        <p className="mb-4 rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200/90">
          {loadError}
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        <Link
          href="/owner/products#owner-product-form"
          className="group relative flex w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 px-6 py-8 text-center shadow-[0_8px_40px_rgba(250,204,21,0.45),0_0_0_3px_rgba(24,24,27,0.9),0_0_0_5px_rgba(234,179,8,0.35)] ring-2 ring-amber-200/90 transition hover:brightness-[1.05] hover:shadow-[0_12px_48px_rgba(250,204,21,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
          aria-describedby="dashboard-add-product-hint"
        >
          <PlusCircleIcon
            className="h-16 w-16 text-zinc-950 drop-shadow-sm sm:h-20 sm:w-20"
            aria-hidden
          />
          <span className="max-w-[16rem] font-serif text-2xl font-bold leading-tight tracking-tight text-zinc-950 sm:text-3xl">
            Tambah produk baru
          </span>
          <span className="text-sm font-semibold text-zinc-900/85">
            Tap di sini — ini langkah utama jualan
          </span>
        </Link>
        <p
          id="dashboard-add-product-hint"
          className="text-center text-xs leading-relaxed text-zinc-500"
        >
          Ubah daftar produk lewat menu di bawah bila perlu.
        </p>
      </div>

      <nav className="mt-6" aria-label="Menu kelola toko">
        <ul className="space-y-2">
          {menuItems.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-zinc-200 transition hover:border-amber-500/20 hover:bg-white/10"
              >
                <Icon className="h-5 w-5 shrink-0 text-amber-500/80" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className="mt-8 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-yellow-600/15 bg-zinc-900/50 p-4">
          <CubeIcon className="h-8 w-8 text-amber-400" aria-hidden />
          <p className="mt-2 text-2xl font-semibold text-zinc-100">
            {metricsReady && totalProducts !== undefined ? totalProducts : "—"}
          </p>
          <p className="text-xs text-zinc-500">Total Produk</p>
        </div>
        <Link
          href="/owner/reports/finance"
          className="rounded-2xl border border-yellow-600/15 bg-zinc-900/50 p-4 transition hover:bg-zinc-800/50"
        >
          <WalletIcon className="h-8 w-8 text-amber-400" aria-hidden />
          <p className="mt-2 text-2xl font-semibold text-zinc-100">
            {metricsReady && revenue !== undefined ? formatRp(revenue) : "—"}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">Pendapatan</p>
            <span className="text-[10px] text-amber-500/80">Detail →</span>
          </div>
        </Link>
      </section>

      <section className="mt-10 rounded-3xl border border-yellow-600/10 bg-white/[0.03] p-4 pb-6 backdrop-blur-md">
        <h2 className="mb-1 text-center font-serif text-sm font-medium text-zinc-500">
          Profil performa
        </h2>
        <p className="mb-3 text-center text-[11px] text-zinc-600">
          Ringkasan visual — bisa dilihat setelah kelola katalog
        </p>
        <OwnerRadar
          stok={radar?.stok}
          pesanan={radar?.pesanan}
          rating={radar?.rating}
        />
        <p className="mt-2 text-center text-[11px] text-zinc-600">
          Sumbu: total stok, jumlah pesanan, rating toko (0–5 → skor radar)
        </p>
      </section>
    </div>
  );
}
