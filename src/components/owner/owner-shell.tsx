"use client";

import { AppShellDecoration } from "@/components/customer/app-shell-decoration";
import { TopBar } from "@/components/ui/TopBar";
import { OwnerQuickNav } from "@/components/owner/owner-admin-chrome";
import {
  OwnerStoreScopeProvider,
  SuperAdminStorePicker,
  useOwnerStoreScope,
} from "@/components/owner/owner-store-scope";
import { useAuth } from "@/components/providers/auth-provider";

function OwnerAccountAlerts() {
  const { user, loading, isOwner, isSuperAdmin } = useAuth();
  const { effectiveStoreId, ready } = useOwnerStoreScope();

  // Don't show warning while loading, not logged in, not owner, or is super admin
  if (loading || !user || !isOwner || isSuperAdmin) {
    return null;
  }

  // Don't show warning if still loading store info
  if (!ready) {
    return null;
  }

  // Don't show warning if store is properly linked
  if (effectiveStoreId) {
    return null;
  }

  // Show warning only when owner has no store linked
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
      <div className="relative min-h-dvh pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 text-zinc-100">
        <AppShellDecoration />
        <div className="relative z-0 px-4 md:mx-auto md:max-w-lg">
          <TopBar showAuthButtons={false} />
          <SuperAdminStorePicker />
          <OwnerAccountAlerts />
        </div>
        <div className="relative z-0">{children}</div>
        <div className="relative z-0">
          <OwnerQuickNav />
        </div>
      </div>
    </OwnerStoreScopeProvider>
  );
}
