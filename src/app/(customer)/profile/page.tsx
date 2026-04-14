import Link from "next/link";
import { createSupabaseServerComponentClient } from "@/lib/supabase/ssr";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerComponentClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = auth.user;

  return (
    <div className="px-4 py-10">
      <h1 className="font-serif text-2xl text-amber-200/90">Profil</h1>
      {user ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
          <p>
            <span className="text-zinc-500">Email:</span> {user.email}
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
