import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function requireOwnerSession() {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    session.user.role !== "owner" ||
    !session.user.storeId
  ) {
    return null;
  }
  return session;
}
