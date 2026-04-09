import { createClient } from "@supabase/supabase-js";
import { MB178_SCHEMA } from "@/lib/mb178/constants";

type Mb178BrowserClient = ReturnType<
  typeof createClient<Record<string, never>, "mb178", "mb178">
>;

let browserClient: Mb178BrowserClient | null = null;

/** Client browser — schema `mb178`, bukan `public` */
export function getSupabaseBrowserClient(): Mb178BrowserClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!browserClient) {
    browserClient = createClient(url, key, { db: { schema: MB178_SCHEMA } });
  }
  return browserClient;
}
