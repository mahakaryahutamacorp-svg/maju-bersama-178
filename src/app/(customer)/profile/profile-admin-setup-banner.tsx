"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

/** Banner setelah middleware mengarahkan akun staff tanpa membership ke profil. */
export function ProfileAdminSetupBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("admin_setup") !== "1") return null;

  return (
    <div
      className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/95"
      role="status"
    >
      <p className="font-medium text-amber-200">Akses admin belum terhubung ke database</p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-300">
        Akun Anda masuk, tetapi tabel{" "}
        <code className="text-amber-200/90">store_memberships</code> belum punya
        baris untuk user ini. Di Supabase SQL Editor jalankan{" "}
        <code className="text-amber-200/90">02-create-auth-users.sql</code> (setelah{" "}
        <code className="text-amber-200/90">01-setup-database.sql</code>), atau minta
        admin menambahkan membership manual. Lihat{" "}
        <Link
          href="https://github.com/mahakaryahutamacorp-svg/maju-bersama-178/blob/main/supabase/README.md"
          className="text-amber-400 underline underline-offset-2"
        >
          supabase/README.md
        </Link>
        .
      </p>
    </div>
  );
}
