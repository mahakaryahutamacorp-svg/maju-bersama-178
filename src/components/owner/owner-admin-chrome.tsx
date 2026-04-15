"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CubeIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

const navItems = [
  { href: "/dashboard", label: "Dashboard", Icon: Squares2X2Icon },
  { href: "/owner/products", label: "Produk", Icon: CubeIcon },
  { href: "/owner/orders", label: "Pesanan", Icon: ClipboardDocumentListIcon },
  { href: "/settings", label: "Toko", Icon: Cog6ToothIcon },
] as const;

function navActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function OwnerQuickNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      aria-label="Menu admin toko"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5 px-1 py-2">
        {navItems.map(({ href, label, Icon }) => {
          const active = navActive(pathname, href);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition sm:text-xs ${active
                  ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.45)]"
                  : "text-zinc-500 hover:text-zinc-300"
                  }`}
              >
                <Icon className="h-6 w-6 shrink-0" aria-hidden />
                <span className="truncate text-center leading-tight">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
