import Link from "next/link";
import { createSupabaseServerComponentClient } from "@/lib/supabase/ssr";
import { mb178UsernameFromEmail, resolveMb178DisplayLabel } from "@/lib/mb178/user-display";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerComponentClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = auth.user;

  let memberDisplayName: string | null = null;
  if (supabase && user) {
    const { data: row } = await supabase
      .from("members")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    memberDisplayName =
      typeof row?.display_name === "string" ? row.display_name : null;
  }
  const displayLabel = resolveMb178DisplayLabel(user, memberDisplayName);

  return (
    <div className="px-4 py-10">
      <h1 className="font-serif text-2xl text-amber-200/90">Profil</h1>
      {user ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
          <p className="font-medium text-zinc-100">
            <span className="text-zinc-500">Nama:</span> {displayLabel}
          </p>
          <p className="mt-2">
            <span className="text-zinc-500">No. HP / username (masuk):</span>{" "}
            {mb178UsernameFromEmail(user.email ?? null)}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">
          <Link
            href="/login"
            className="text-amber-400 underline underline-offset-4"
          >
            Masuk
          </Link>{" "}
          untuk melihat akun.
        </p>
      )}
    </div>
  );
}
