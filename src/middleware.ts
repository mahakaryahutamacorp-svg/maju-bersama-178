import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { MB178_SCHEMA } from "./lib/mb178/constants";
import { isMb178SeedStaffEmail } from "./lib/mb178/staff-account";

/**
 * Auth guard middleware — melindungi rute owner/dashboard/settings.
 * Redirect ke /login jika belum login atau bukan owner/super_admin.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
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
      db: { schema: MB178_SCHEMA },
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
      login.searchParams.set("mode", "owner");
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
      const fallback = isMb178SeedStaffEmail(auth.user.email)
        ? "/profile?admin_setup=1"
        : "/";
      return NextResponse.redirect(new URL(fallback, req.url), {
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
