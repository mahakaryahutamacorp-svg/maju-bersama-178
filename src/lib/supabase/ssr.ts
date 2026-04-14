import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { MB178_SCHEMA } from "@/lib/mb178/constants";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/**
 * Route Handler / Server Actions client (read-write cookies).
 */
export async function createSupabaseRouteClient() {
  const env = getEnv();
  if (!env) return null;
  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    db: { schema: MB178_SCHEMA },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options as CookieOptions);
        });
      },
    },
  });
}

/**
 * Server Component client (cookies are effectively read-only; we don't attempt refresh writes).
 */
export async function createSupabaseServerComponentClient() {
  const env = getEnv();
  if (!env) return null;
  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    db: { schema: MB178_SCHEMA },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Server Components can't set cookies; skip refresh writes.
      },
    },
  });
}

