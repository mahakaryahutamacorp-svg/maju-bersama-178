"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/auth-provider";

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
  const { user, loading, isOwner, signOut } = useAuth();

  const loggedIn = !loading && !!user;

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

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
        {loggedIn ? (
          <>
            {isOwner ? (
              <>
                <Link
                  href="/dashboard"
                  className={`${buttonClass("ghost")} w-auto border-amber-500/15 px-3 shadow-[0_0_20px_rgba(0,0,0,0.35)] sm:px-4`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/owner/products#owner-product-form"
                  className={`${buttonClass("ghost")} inline-flex w-auto border-amber-500/15 px-3 shadow-[0_0_20px_rgba(0,0,0,0.35)] sm:px-4`}
                >
                  + Produk
                </Link>
              </>
            ) : (
              <Link
                href="/profile"
                className={`${buttonClass("ghost")} w-auto border-amber-500/15 px-4 shadow-[0_0_20px_rgba(0,0,0,0.35)]`}
              >
                Profil
              </Link>
            )}
            <button
              type="button"
              className={`${buttonClass("toko")} w-auto px-4 shadow-[0_0_28px_rgba(212,175,55,0.28)]`}
              onClick={() => void signOut()}
            >
              Logout
            </button>
          </>
        ) : showAuthButtons ? (
          <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-zinc-950/75 p-1 pl-2 shadow-[0_0_32px_rgba(212,175,55,0.08)] backdrop-blur-md">
            <Link
              href="/login?mode=owner"
              className="hidden text-[11px] font-medium uppercase tracking-wider text-zinc-500 transition hover:text-amber-400/90 sm:inline sm:px-1"
            >
              Admin
            </Link>
            <span className="hidden h-4 w-px bg-amber-500/20 sm:block" aria-hidden />
            <Link
              href="/login?mode=customer"
              className="rounded-full px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white sm:px-4 sm:text-sm"
            >
              Masuk
            </Link>
            <Link
              href="/login?mode=customer"
              className="rounded-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 px-3 py-2 text-xs font-semibold text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] ring-1 ring-amber-400/40 transition hover:brightness-110 sm:px-5 sm:text-sm"
            >
              Daftar
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

