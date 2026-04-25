"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseRouteClient } from "@/lib/supabase/ssr";
import { createMb178Client } from "@/lib/supabase/admin";
import { 
  getStoreSlugByStaffLocalPart, 
  isMb178SeedStaffEmail, 
  mb178EmailLocalPart 
} from "@/lib/mb178/staff-account";

export type LinkStaffResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Server Action untuk menautkan akun staff ke toko secara otomatis.
 * Hanya bekerja untuk akun dengan format email staff yang dikenal.
 */
export async function linkStaffMembershipAction(): Promise<LinkStaffResult> {
  const supabase = await createSupabaseRouteClient();
  if (!supabase) return { ok: false, error: "Database tidak terhubung." };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Silakan masuk terlebih dahulu." };

  const email = auth.user.email;
  if (!isMb178SeedStaffEmail(email)) {
    return { ok: false, error: "Hanya akun staff yang bisa ditautkan otomatis." };
  }

  const localPart = mb178EmailLocalPart(email);
  const storeSlug = getStoreSlugByStaffLocalPart(localPart);

  if (!storeSlug) {
    return { ok: false, error: "Toko tidak ditemukan untuk akun ini." };
  }

  const admin = createMb178Client();
  if (!admin) return { ok: false, error: "Service role tidak aktif." };

  // 1. Cari store ID berdasarkan slug
  const { data: store, error: storeErr } = await admin
    .from("stores")
    .select("id")
    .eq("slug", storeSlug)
    .single();

  if (storeErr || !store) {
    return { ok: false, error: `Store '${storeSlug}' belum dibuat di database.` };
  }

  // 2. Insert membership (Owner untuk toko deskriptif/generik)
  const { error: linkErr } = await admin
    .from("store_memberships")
    .insert({
      user_id: auth.user.id,
      store_id: store.id,
      role: "owner"
    });

  if (linkErr) {
    // Jika sudah ada (conflict), anggap sukses
    if (linkErr.code === "23505") {
      revalidatePath("/profile");
      return { ok: true };
    }
    return { ok: false, error: "Gagal menautkan: " + linkErr.message };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}
