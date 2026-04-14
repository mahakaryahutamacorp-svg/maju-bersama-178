import { NextResponse } from "next/server";

/**
 * Setelah requireOwnerSession: pastikan ada store aktif (owner punya store di JWT;
 * super_admin wajib ?store_id=...).
 */
export interface OwnerSessionUser {
  id: string;
  email: string | null;
  role: "owner" | "super_admin";
  storeId?: string;
}

export interface OwnerSession {
  user: OwnerSessionUser;
}

export function requireResolvedStoreId(session: OwnerSession): string | NextResponse {
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
