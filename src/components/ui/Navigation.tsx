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

  return (
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
  );
}
