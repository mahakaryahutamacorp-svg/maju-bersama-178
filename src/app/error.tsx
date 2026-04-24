"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      <div className="max-w-md">
        <h2 className="font-serif text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-500">
          Waduh! Ada Masalah.
        </h2>
        <p className="mt-4 text-sm text-zinc-500 leading-relaxed">
          Terjadi kesalahan yang tidak terduga saat memuat halaman ini. Jangan khawatir, kami sudah mencatatnya.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-3 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20"
          >
            Coba Lagi
          </button>
          <Link
            href="/"
            className="text-xs text-zinc-600 underline underline-offset-4 hover:text-zinc-400"
          >
            Kembali ke Beranda
          </Link>
        </div>
        {process.env.NODE_ENV === "development" && (
          <pre className="mt-10 overflow-auto rounded-xl bg-red-950/20 p-4 text-left text-[10px] text-red-400/80 border border-red-500/10">
            {error.message}
            {error.digest && `\nDigest: ${error.digest}`}
          </pre>
        )}
      </div>
    </div>
  );
}
