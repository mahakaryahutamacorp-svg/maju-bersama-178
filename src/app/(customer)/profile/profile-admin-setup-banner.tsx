"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { linkStaffMembershipAction } from "./membership-actions";

/** Banner setelah middleware mengarahkan akun staff tanpa membership ke profil. */
export function ProfileAdminSetupBanner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (searchParams.get("admin_setup") !== "1") return null;

  async function onLink() {
    setError(null);
    startTransition(async () => {
      const res = await linkStaffMembershipAction();
      if (!res.ok) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div
      className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/95"
      role="status"
    >
      <p className="font-medium text-amber-200">Akses admin belum terhubung ke database</p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-300">
        Akun Anda masuk, tetapi tabel{" "}
        <code className="text-amber-200/90">store_memberships</code> belum punya
        baris untuk user ini. Jalankan kembali script seed atau klik tombol di bawah
        untuk menghubungkan secara otomatis.
      </p>

      {error && <p className="mt-2 text-xs text-red-400 font-medium">{error}</p>}

      <div className="mt-4">
        <button
          onClick={onLink}
          disabled={isPending}
          className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          {isPending ? "Menghubungkan…" : "Hubungkan Sekarang →"}
        </button>
      </div>
    </div>
  );
}
