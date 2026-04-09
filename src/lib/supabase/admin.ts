import { createClient } from "@supabase/supabase-js";
import { MB178_SCHEMA } from "@/lib/mb178/constants";

/**
 * Client server-side: pakai SERVICE ROLE (disarankan) atau anon sebagai fallback.
 * Hanya impor dari Route Handler / Server Component — jangan dari komponen client.
 */
export function createMb178Client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceKey?.trim() || anonKey?.trim();
  if (!url?.trim() || !key) return null;
  return createClient(url, key, {
    db: { schema: MB178_SCHEMA },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Khusus server: wajib SERVICE ROLE (untuk auth/seed/ops owner yang diblok RLS). */
export function createMb178ServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim() || !serviceKey?.trim()) return null;
  return createClient(url, serviceKey.trim(), {
    db: { schema: MB178_SCHEMA },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
