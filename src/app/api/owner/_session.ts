import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

/**
 * Returns session if user is owner (with storeId) or super_admin.
 * super_admin can pass ?store_id=<uuid> query param to act on any store.
 */
export async function requireOwnerSession(request?: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const { role, storeId } = session.user;

  if (role === "super_admin") {
    let targetStoreId = storeId;
    if (request) {
      const url = new URL(request.url);
      targetStoreId = url.searchParams.get("store_id") ?? storeId ?? undefined;
    }
    return {
      ...session,
      user: { ...session.user, storeId: targetStoreId ?? undefined },
    };
  }

  if (role !== "owner" || !storeId) return null;

  return session;
}
