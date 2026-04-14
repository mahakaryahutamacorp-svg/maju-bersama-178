import { createClient } from "@supabase/supabase-js";

/**
 * Client server-side: wajib SERVICE ROLE.
 * Hanya impor dari Route Handler / Server Component — jangan dari komponen client.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim() || !serviceKey?.trim()) return null;
  return createClient(url, serviceKey.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * @deprecated Use `createServiceClient()` instead.
 * Alias tetap ada agar import lama tidak langsung rusak.
 */
export const createMb178Client = createServiceClient;
export const createMb178ServiceClient = createServiceClient;
