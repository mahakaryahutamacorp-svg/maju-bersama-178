import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { UserRole } from "@/types/next-auth";

type MockUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  storeInitials?: string;
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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = mockUsers.find(
          (u) =>
            u.email === credentials.email && u.password === credentials.password
        );
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          storeInitials: user.storeInitials,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.storeInitials = user.storeInitials;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as UserRole;
        session.user.storeInitials = token.storeInitials as string | undefined;
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
