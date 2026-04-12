import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * next-auth mem-parse NEXTAUTH_URL saat modul client dimuat. String kosong (sering dari
 * `vercel pull` / env placeholder) membuat `new URL("")` → TypeError: Invalid URL dan build gagal.
 */
function normalizeNextAuthUrlForBuild() {
  const trimmed = process.env.NEXTAUTH_URL?.trim();
  if (trimmed) {
    process.env.NEXTAUTH_URL = trimmed;
    return;
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    process.env.NEXTAUTH_URL = vercel.startsWith("http")
      ? vercel
      : `https://${vercel}`;
    return;
  }
  process.env.NEXTAUTH_URL = "http://localhost:3000";
}

normalizeNextAuthUrlForBuild();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseHost = (() => {
  if (!supabaseUrl) return null;
  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      ...(supabaseHost
        ? [
          {
            protocol: "https" as const,
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
        : []),
    ],
  },
};

export default nextConfig;
