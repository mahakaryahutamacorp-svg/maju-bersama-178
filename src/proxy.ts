import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect owner/admin routes
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/owner")
  ) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!url || !anonKey) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const res = NextResponse.next();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      const login = new URL("/login", req.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login, { headers: res.headers });
    }

    const { data: roles } = await supabase
      .from("store_memberships")
      .select("role")
      .eq("user_id", auth.user.id)
      .in("role", ["owner", "super_admin"])
      .limit(1);

    if (!roles?.length) {
      return NextResponse.redirect(new URL("/", req.url), {
        headers: res.headers,
      });
    }

    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/owner/:path*"],
};
