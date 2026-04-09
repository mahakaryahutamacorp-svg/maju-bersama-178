import "next-auth";
import "next-auth/jwt";

export type UserRole = "super_admin" | "owner" | "customer";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      storeInitials?: string | null;
      /** `mb178.stores.id` untuk peran owner */
      storeId?: string | null;
    };
  }

  interface User {
    role: UserRole;
    storeInitials?: string | null;
    storeId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    storeInitials?: string | null;
    storeId?: string | null;
  }
}
