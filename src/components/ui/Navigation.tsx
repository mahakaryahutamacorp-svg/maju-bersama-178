"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { CubeIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";

const items = [
  { href: "/", label: "Beranda", Icon: HomeIcon },
  { href: "/search", label: "Cari", Icon: MagnifyingGlassIcon },
  { href: "/cart", label: "Keranjang", Icon: ShoppingCartIcon },
  { href: "/orders", label: "Pesanan", Icon: ClipboardDocumentListIcon },
  { href: "/profile", label: "Profil", Icon: UserIcon },
] as const;

function navClass(active: boolean) {
  return active
    ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
    : "text-zinc-500 hover:text-zinc-300";
}

export function Navigation() {
  const pathname = usePathname();
  const { user, isOwner, likelySeedStaffEmail } = useAuth();
  const showOwnerFab = !!user && (isOwner || likelySeedStaffEmail);

  return (
    <>
      {showOwnerFab ? (
        <Link
          href="/owner/products#owner-product-form"
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-3 z-[60] flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/40 bg-gradient-to-br from-amber-500 to-yellow-500 text-zinc-950 shadow-[0_8px_28px_rgba(234,179,8,0.45)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          aria-label="Tambah produk (admin toko)"
        >
          <CubeIcon className="h-7 w-7" aria-hidden />
        </Link>
      ) : null}
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-zinc-950/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      aria-label="Navigasi utama"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-1 px-2 py-2">
        {items.map(({ href, label, Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-xs transition ${navClass(active)}`}
              >
                <Icon className="h-6 w-6" aria-hidden />
                <span className="font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
    </>
  );
}
