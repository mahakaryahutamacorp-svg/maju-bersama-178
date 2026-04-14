"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CubeIcon,
  WalletIcon,
  PencilSquareIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
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
    href: "/settings",
    label: "Pengaturan Toko",
    Icon: Cog6ToothIcon,
  },
];

type Stats = {
  connected: boolean;
  totalProducts: number;
  totalStock: number;
  orderCount: number;
  revenue: number;
  rating05: number;
  radar: { stok: number; pesanan: number; rating: number };
};

function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

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
        const json = (await res.json()) as Stats & {
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
          setStats(json);
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

  const initials = (user.email ?? "MB").slice(0, 2).toUpperCase();
  const radar = stats?.radar;
  const totalProducts = stats?.totalProducts;
  const revenue = stats?.revenue;
  const metricsReady = stats !== null && stats.connected;

  return (
    <div className="px-4 md:mx-auto md:max-w-lg">
      <header className="mb-8 flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-500/40 bg-zinc-900 text-lg font-semibold text-amber-300 shadow-[0_0_28px_rgba(250,204,21,0.35)]"
          aria-hidden
        >
          {initials}
        </div>
        <div>
          <p className="font-serif text-xl text-amber-100/90">Dashboard</p>
          <p className="text-sm text-zinc-500">{user.email}</p>
        </div>
      </header>

      {loadError ? (
        <p className="mb-4 rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200/90">
          {loadError}
        </p>
      ) : null}

      {stats && !stats.connected ? (
        <p className="mb-4 text-center text-xs text-zinc-500">
          Supabase belum terhubung — angka & radar memakai contoh. Isi env & jalankan{" "}
          <code className="text-zinc-400">supabase/setup-complete.sql</code>.
        </p>
      ) : null}

      <p className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[11px] leading-relaxed text-zinc-500">
        <span className="font-medium text-zinc-400">Konfigurasi toko:</span> nama,
        alamat, dan WhatsApp di{" "}
        <Link
          href="/settings"
          className="text-amber-500/90 underline underline-offset-2 hover:text-amber-400"
        >
          Pengaturan Toko
        </Link>
        . Toko yang aktif ditampilkan di banner di atas halaman.
      </p>

      <div className="flex flex-col gap-3">
        <Link
          href="/owner/products#owner-product-form"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 py-3.5 text-sm font-semibold text-zinc-950 shadow-[0_0_28px_rgba(250,204,21,0.35)] ring-1 ring-amber-400/40 transition hover:brightness-110"
        >
          <PencilSquareIcon className="h-5 w-5" aria-hidden />
          Tambah produk
        </Link>
        <p className="text-center text-[11px] text-zinc-500">
          Edit atau hapus produk lewat menu di bawah, lalu buka halaman produk.
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
        <div className="rounded-2xl border border-yellow-600/15 bg-zinc-900/50 p-4">
          <WalletIcon className="h-8 w-8 text-amber-400" aria-hidden />
          <p className="mt-2 text-2xl font-semibold text-zinc-100">
            {metricsReady && revenue !== undefined ? formatRp(revenue) : "—"}
          </p>
          <p className="text-xs text-zinc-500">Pendapatan (non-batal)</p>
        </div>
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
