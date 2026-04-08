"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  CubeIcon,
  WalletIcon,
  PencilSquareIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { OwnerRadar } from "@/components/owner/owner-radar";

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

export default function OwnerDashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="px-4 py-16 text-center text-sm text-zinc-500">
        Memuat…
      </div>
    );
  }

  if (!session?.user || session.user.role !== "owner") {
    return null;
  }

  const initials = session.user.storeInitials ?? "RG";

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
          <p className="text-sm text-zinc-500">{session.user.name}</p>
        </div>
      </header>

      <section className="rounded-3xl border border-yellow-600/15 bg-white/5 p-4 backdrop-blur-md">
        <h2 className="mb-2 text-center font-serif text-sm font-medium text-zinc-400">
          Ability Radar
        </h2>
        <OwnerRadar />
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-yellow-600/15 bg-zinc-900/50 p-4">
          <CubeIcon className="h-8 w-8 text-amber-400" aria-hidden />
          <p className="mt-2 text-2xl font-semibold text-zinc-100">128</p>
          <p className="text-xs text-zinc-500">Total Produk</p>
        </div>
        <div className="rounded-2xl border border-yellow-600/15 bg-zinc-900/50 p-4">
          <WalletIcon className="h-8 w-8 text-amber-400" aria-hidden />
          <p className="mt-2 text-2xl font-semibold text-zinc-100">Rp 12,4jt</p>
          <p className="text-xs text-zinc-500">Laporan Pendapatan</p>
        </div>
      </section>

      <nav className="mt-8" aria-label="Menu kelola toko">
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
    </div>
  );
}
