import { NextResponse } from "next/server";
import type { Session } from "next-auth";

/**
 * Setelah requireOwnerSession: pastikan ada store aktif (owner punya store di JWT;
 * super_admin wajib ?store_id=...).
 */
export function requireResolvedStoreId(session: Session): string | NextResponse {
  const id = session.user.storeId?.trim();
  if (id) return id;
  return NextResponse.json(
    {
      error:
        "Belum ada toko yang dipilih. Untuk Master Admin, pilih toko di menu atas.",
      code: "STORE_REQUIRED",
    },
    { status: 400 }
  );
}
