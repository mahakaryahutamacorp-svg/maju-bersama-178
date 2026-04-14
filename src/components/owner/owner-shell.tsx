"use client";

import { TopBar } from "@/components/ui/TopBar";
import {
  OwnerStoreScopeProvider,
  SuperAdminStorePicker,
} from "@/components/owner/owner-store-scope";
import { useAuth } from "@/components/providers/auth-provider";

function OwnerAccountAlerts() {
  const { user, loading, isOwner, isSuperAdmin } = useAuth();
  if (loading || !user || !isOwner || isSuperAdmin) {
    return null;
  }
  return (
    <p className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-100/90">
      Akun pemilik ini belum ditautkan ke toko di database. Periksa entri{" "}
      <code className="text-zinc-400">public.store_memberships</code> untuk user
      ini.
    </p>
  );
}

export function OwnerShell({ children }: { children: React.ReactNode }) {
  return (
    <OwnerStoreScopeProvider>
      <div className="min-h-dvh bg-[var(--charcoal)] pb-8 pt-4 text-zinc-100">
        <div className="px-4 md:mx-auto md:max-w-lg">
          <TopBar showAuthButtons={false} />
          <SuperAdminStorePicker />
          <OwnerAccountAlerts />
        </div>
        {children}
      </div>
    </OwnerStoreScopeProvider>
  );
}
