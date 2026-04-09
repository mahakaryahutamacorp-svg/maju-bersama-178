import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const hasSecret = !!process.env.NEXTAUTH_SECRET?.trim();
  const nextauthUrl = process.env.NEXTAUTH_URL ?? "(not set)";

  return NextResponse.json({
    nextauth: {
      NEXTAUTH_SECRET: hasSecret ? "set" : "MISSING",
      NEXTAUTH_URL: nextauthUrl,
    },
    supabase: {
      NEXT_PUBLIC_SUPABASE_URL: url ? "set" : "MISSING",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnon ? "set" : "MISSING",
      SUPABASE_SERVICE_ROLE_KEY: hasService ? "set" : "MISSING",
    },
  });
}
