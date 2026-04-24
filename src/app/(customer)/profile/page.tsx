import Link from "next/link";
import { createSupabaseServerComponentClient } from "@/lib/supabase/ssr";
import { mb178UsernameFromEmail, resolveMb178DisplayLabel } from "@/lib/mb178/user-display";
import { ProfileForm } from "./profile-form";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerComponentClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = auth.user;

  let memberDisplayName: string | null = null;
  let isStoreAdmin = false;
  if (supabase && user) {
    const { data: row } = await supabase
      .from("members")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    memberDisplayName =
      typeof row?.display_name === "string" ? row.display_name : null;

    const { data: adminRows } = await supabase
      .from("store_memberships")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["owner", "super_admin"])
      .limit(1);
    isStoreAdmin = !!adminRows?.length;
  }
  const displayLabel = resolveMb178DisplayLabel(user, memberDisplayName);

  return (
    <div className="px-4 py-10 md:mx-auto md:max-w-lg">
      <h1 className="font-serif text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
        Akun Saya
      </h1>

      {user ? (
        <div className="mt-6 space-y-8">
          {isStoreAdmin ? (
            <section>
              <Link
                href="/dashboard"
                className="block rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-950/40 via-zinc-900/60 to-zinc-950/90 p-4 shadow-[0_0_28px_rgba(234,179,8,0.12)] transition hover:border-amber-400/55"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-200/90">
                  Admin toko
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-100">
                  Kelola produk, pesanan, dan pengaturan toko
                </p>
                <p className="mt-2 text-xs text-amber-400/90">
                  Buka dashboard →
                </p>
              </Link>
            </section>
          ) : null}
          <section>
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
              Informasi Masuk
            </h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="text-zinc-500">No. HP / Username</p>
              <p className="mt-0.5 font-medium text-zinc-100">
                {mb178UsernameFromEmail(user.email ?? null)}
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
              Pengaturan Profil
            </h2>
            <ProfileForm initialDisplayName={displayLabel} />
          </section>

          <div className="pt-4">
            <LogoutButton />
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-700 py-12 text-center">
          <p className="text-sm text-zinc-500">
            Silakan{" "}
            <Link
              href="/login"
              className="text-amber-400 underline underline-offset-4"
            >
              Masuk
            </Link>{" "}
            untuk mengelola profil Anda.
          </p>
        </div>
      )}
    </div>
  );
}
