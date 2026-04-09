"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { buttonClass } from "@/components/ui/Button";

type Props = {
  /** tampilkan tombol masuk/daftar jika belum login */
  showAuthButtons?: boolean;
  /** tampilkan tombol kembali jika dibutuhkan */
  backHref?: string;
  backLabel?: string;
};

export function TopBar({
  showAuthButtons = true,
  backHref,
  backLabel = "← Kembali",
}: Props) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const loggedIn = status === "authenticated" && !!session?.user;
  const isOwner = session?.user?.role === "owner";
  const hideDashboard = pathname === "/";

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="text-sm text-amber-500/90 underline-offset-4 hover:underline"
          >
            {backLabel}
          </Link>
        ) : (
          <span className="text-xs text-zinc-600" />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {loggedIn ? (
          <>
            {isOwner && !hideDashboard ? (
              <Link
                href="/dashboard"
                className={`${buttonClass("ghost")} w-auto px-4`}
              >
                Dashboard
              </Link>
            ) : (
              !isOwner ? (
                <Link
                  href="/profile"
                  className={`${buttonClass("ghost")} w-auto px-4`}
                >
                  Profil
                </Link>
              ) : null
            )}
            <button
              type="button"
              className={`${buttonClass("toko")} w-auto px-4`}
              onClick={() => void signOut({ callbackUrl: "/" })}
            >
              Logout
            </button>
          </>
        ) : showAuthButtons ? (
          <>
            <Link href="/login?mode=customer" className={`${buttonClass("ghost")} w-auto px-4`}>
              Masuk
            </Link>
            <Link href="/login?mode=customer" className={`${buttonClass("toko")} w-auto px-4`}>
              Daftar
            </Link>
          </>
        ) : null}
      </div>
    </div>
  );
}

