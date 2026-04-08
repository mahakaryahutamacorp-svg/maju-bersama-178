import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="px-4 py-10">
      <h1 className="font-serif text-2xl text-amber-200/90">Profil</h1>
      {session?.user ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
          <p>
            <span className="text-zinc-500">Nama:</span> {session.user.name}
          </p>
          <p className="mt-1">
            <span className="text-zinc-500">Email:</span> {session.user.email}
          </p>
          <p className="mt-1">
            <span className="text-zinc-500">Peran:</span> {session.user.role}
          </p>
          {session.user.role === "owner" ? (
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-amber-400 underline underline-offset-4"
            >
              Buka dashboard toko
            </Link>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">
          <Link
            href="/login"
            className="text-amber-400 underline underline-offset-4"
          >
            Masuk
          </Link>{" "}
          untuk melihat akun (demo: owner@maju.id / demo).
        </p>
      )}
    </div>
  );
}
