import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { UserRole } from "@/types/next-auth";
import { createMb178ServiceClient } from "@/lib/supabase/admin";
import { verifyPassword } from "@/lib/auth/password";

type MockUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  storeInitials?: string;
  storeId?: string;
};

const mockUsers: MockUser[] = [
  {
    id: "1",
    email: "husni@maju.id",
    password: "demo",
    name: "Pak Husni",
    role: "super_admin",
  },
  {
    id: "2",
    email: "owner@maju.id",
    password: "demo",
    name: "Rocell Gadget",
    role: "owner",
    storeInitials: "RG",
    storeId: "pupuk-maju",
  },
  {
    id: "3",
    email: "customer@maju.id",
    password: "demo",
    name: "Pelanggan",
    role: "customer",
  },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "User ID / Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const identifier = String(credentials.email).trim();
        const password = String(credentials.password);

        // 1) Coba user dari database (mb178.app_users) jika Supabase tersedia.
        const supabase = createMb178ServiceClient();
        if (supabase) {
          const { data, error } = await supabase
            .from("app_users")
            .select("id, user_id, password_hash, password_salt, name, role, store_id")
            .eq("user_id", identifier)
            .maybeSingle();

          if (error) {
            // jangan bocorkan detail error ke client (NextAuth akan tampilkan generic)
            return null;
          }

          if (data) {
            const ok = verifyPassword(password, data.password_salt, data.password_hash);
            if (!ok) return null;
            return {
              id: data.id,
              email: `${data.user_id}@local.mb178`, // placeholder email untuk NextAuth
              name: data.name ?? data.user_id,
              role: (data.role as UserRole) ?? "customer",
              storeId: data.store_id ?? undefined,
              storeInitials: (data.name ?? data.user_id).slice(0, 2).toUpperCase(),
            };
          }
        }

        // 2) Fallback mock demo.
        const user = mockUsers.find(
          (u) => u.email === identifier && u.password === password
        );
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          storeInitials: user.storeInitials,
          storeId: user.storeId,
        };
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
};
