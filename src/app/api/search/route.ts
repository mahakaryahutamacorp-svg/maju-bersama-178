import { NextResponse } from "next/server";
import { createMb178Client } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/mb178/rate-limit";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const { success } = rateLimit(`search_${ip}`, 30, 60 * 1000);
  
  if (!success) {
    return NextResponse.json(
      { error: "Terlalu banyak pencarian. Silakan tunggu sebentar." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = createMb178Client();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  /* Search products across all stores */
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      price,
      image_url,
      category,
      store:stores (
        name,
        slug
      )
    `)
    .ilike("name", `%${q}%`)
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ results: data || [] });
}
