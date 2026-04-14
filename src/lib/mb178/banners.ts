import type { BannerSlideItem } from "@/components/customer/banner-slider";
import type { Mb178BannerRow } from "@/lib/mb178/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchActiveBannersForHome(
  supabase: SupabaseClient
): Promise<BannerSlideItem[]> {
  const { data, error } = await supabase
    .from("banners")
    .select("id, image_url, title, is_active, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error || !data?.length) return [];

  return (data as Mb178BannerRow[]).map((b) => ({
    id: b.id,
    imageUrl: b.image_url,
    title: b.title,
  }));
}
