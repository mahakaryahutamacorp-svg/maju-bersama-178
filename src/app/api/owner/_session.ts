import { createSupabaseRouteClient } from "@/lib/supabase/ssr";
import type { OwnerSession } from "@/app/api/owner/_store-id";

/**
 * Returns session if user is owner (with storeId) or super_admin.
 * super_admin can pass ?store_id=<uuid> query param to act on any store.
 */
export async function requireOwnerSession(request?: Request) {
  const supabase = await createSupabaseRouteClient();
  if (!supabase) return null;

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) return null;

  const userId = auth.user.id;

  const { data: memberships, error: memErr } = await supabase
    .from("store_memberships")
    .select("store_id, role")
    .eq("user_id", userId);

  if (memErr || !memberships?.length) return null;

  const hasSuperAdmin = memberships.some((m) => m.role === "super_admin");
  const ownerMembership = memberships.find((m) => m.role === "owner");

  if (!hasSuperAdmin && !ownerMembership) return null;

  const superAdminStoreIds = new Set(
    memberships.filter((m) => m.role === "super_admin").map((m) => m.store_id)
  );

  let storeId: string | undefined = ownerMembership?.store_id ?? undefined;
  let role: OwnerSession["user"]["role"] = "owner";

  if (hasSuperAdmin) {
    role = "super_admin";
    if (request) {
      const url = new URL(request.url);
      const param = url.searchParams.get("store_id")?.trim() ?? "";
      const uuidOk =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          param
        );
      if (uuidOk && superAdminStoreIds.has(param)) {
        storeId = param;
      }
    }
  }

  const session: OwnerSession = {
    user: {
      id: userId,
      email: auth.user.email ?? null,
      role,
      storeId,
    },
  };

  return session;
}
