import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth-options";

if (!process.env.NEXTAUTH_SECRET) {
  console.error(
    "[next-auth] NEXTAUTH_SECRET is not set. Auth will fail in production. " +
    "Set it in Vercel → Settings → Environment Variables.",
  );
}

/** Di dev, Next bisa pindah port (3000 → 3001); samakan NEXTAUTH_URL dengan origin request agar tidak Server Error / CSRF gagal. */
function syncDevNextAuthUrl(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") return;
  const origin = req.nextUrl.origin;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
    process.env.NEXTAUTH_URL = origin;
  }
}

const inner = NextAuth(authOptions);

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  syncDevNextAuthUrl(req);
  return inner(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  syncDevNextAuthUrl(req);
  return inner(req, context);
}
