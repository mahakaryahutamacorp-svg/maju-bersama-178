import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { UserRole } from "@/types/next-auth";
import { createMb178ServiceClient } from "@/lib/supabase/admin";
import { verifyPassword } from "@/lib/auth/password";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const identifier = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        const supabase = createMb178ServiceClient();
        if (!supabase) {
          console.error("[auth] Supabase service client not available");
          return null;
        }

        try {
          const { data, error } = await supabase
            .from("app_users")
            .select("id, user_id, password_hash, password_salt, name, role, store_id")
            .eq("user_id", identifier)
            .maybeSingle();

          if (error) {
            console.error("[auth] Supabase query error:", error.message);
            return null;
          }

          if (!data) return null;

          const ok = verifyPassword(password, data.password_salt, data.password_hash);
          if (!ok) return null;

          return {
            id: data.id,
            email: `${data.user_id}@local.mb178`,
            name: data.name ?? data.user_id,
            role: (data.role as UserRole) ?? "customer",
            storeId: data.store_id ?? undefined,
            storeInitials: (data.name ?? data.user_id).slice(0, 2).toUpperCase(),
          };
        } catch (e) {
          console.error("[auth] Unexpected error:", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.storeInitials = user.storeInitials;
        token.storeId = user.storeId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as UserRole;
        session.user.storeInitials = token.storeInitials as string | undefined;
        session.user.storeId = token.storeId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  logger: {
    error(code, metadata) {
      console.error("[next-auth][error]", code, metadata);
    },
    warn(code) {
      console.warn("[next-auth][warn]", code);
    },
  },
};
