import { NextResponse } from "next/server";
import { requireOwnerSession } from "@/app/api/owner/_session";
import { createMb178Client } from "@/lib/supabase/admin";
import { hintForSupabaseError } from "@/lib/supabase/error-hints";

/**
 * Daftar tabel master catalog yang tersedia.
 * Key = identifier yang dikirim client, value = nama tabel Postgres.
 */
const CATALOG_TABLES: Record<string, { table: string; label: string }> = {
  pertanian: { table: "master_catalog_pertanian", label: "Pertanian" },
  elektronik: { table: "master_catalog_elektronik", label: "Elektronik" },
  estetika: { table: "master_catalog_estetika", label: "Estetika" },
  medis: { table: "master_catalog_medis", label: "Medis" },
  pakan: { table: "master_catalog_pakan", label: "Pakan Ternak" },
  travel: { table: "master_catalog_travel", label: "Travel" },
  fnb: { table: "master_catalog_fnb", label: "F&B" },
};

/**
 * GET /api/owner/master-catalog?catalog=pertanian&q=roundup
 *
 * Mengembalikan list produk dari master catalog tertentu.
 * Jika tidak ada query `catalog`, kembalikan daftar katalog yang tersedia.
 */
export async function GET(request: Request) {
  const session = await requireOwnerSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createMb178Client();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service role belum dikonfigurasi" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const catalogKey = url.searchParams.get("catalog")?.trim();
  const searchQuery = url.searchParams.get("q")?.trim();

  /* Jika tidak ada catalog parameter, kembalikan daftar katalog */
  if (!catalogKey) {
    /* Cek tabel mana yang benar-benar ada di database */
    const available: { key: string; label: string; count: number }[] = [];

    for (const [key, { table, label }] of Object.entries(CATALOG_TABLES)) {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (!error && count !== null) {
        available.push({ key, label, count });
      }
    }

    return NextResponse.json({ catalogs: available });
  }

  const entry = CATALOG_TABLES[catalogKey];
  if (!entry) {
    return NextResponse.json(
      {
        error: `Katalog "${catalogKey}" tidak dikenali.`,
        available: Object.keys(CATALOG_TABLES),
      },
      { status: 400 },
    );
  }

  /* Query produk dari tabel master catalog */
  let query = supabase
    .from(entry.table)
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("product_name", { ascending: true })
    .limit(200);

  /* Pencarian sederhana (ilike) jika ada query */
  if (searchQuery) {
    query = query.or(
      `product_name.ilike.%${searchQuery}%,brand_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: hintForSupabaseError(error.message) },
      { status: 503 },
    );
  }

  return NextResponse.json({
    catalog: catalogKey,
    label: entry.label,
    items: data ?? [],
  });
}
