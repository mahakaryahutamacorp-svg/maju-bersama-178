"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const mode = searchParams.get("mode") ?? "customer";
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regName, setRegName] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await signIn("credentials", {
      email: userId.trim().toLowerCase(),
      password,
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      setError("Username atau password salah.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  async function onQuickRegister() {
    if (!/^\d{6}$/.test(password)) {
      setError("Password harus 6 digit angka (contoh: 223344)");
      return;
    }
    setError(null);
    setRegistering(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim().toLowerCase(),
          password,
          name: regName.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Gagal daftar");
        return;
      }
      const login = await signIn("credentials", {
        email: userId.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (login?.error) {
        setError("Akun dibuat, tapi login gagal. Coba masuk ulang.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Gagal daftar.");
    } finally {
      setRegistering(false);
    }
  }

  const isOwner = mode === "owner";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--charcoal)] px-4">
      <div className="w-full max-w-sm rounded-3xl border border-yellow-600/20 bg-white/5 p-8 backdrop-blur-md">
        <h1 className="font-serif text-center text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">
          {isOwner ? "Masuk Admin Toko" : "Masuk / Daftar"}
        </h1>
        {!isOwner && (
          <p className="mt-2 text-center text-xs text-zinc-500">
            Buat username sendiri, password 6 digit angka.
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="userId" className="text-xs text-zinc-500">
              Username
            </label>
            <input
              id="userId"
              name="userId"
              type="text"
              autoComplete="username"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder={isOwner ? "mama01" : "contoh: yayan12"}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs text-zinc-500">
              Password {!isOwner && <span className="text-zinc-600">(6 digit angka)</span>}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                const v = e.target.value;
                if (!isOwner) {
                  if (/^\d{0,6}$/.test(v)) setPassword(v);
                } else {
                  setPassword(v);
                }
              }}
              placeholder={isOwner ? "••••••" : "6 digit angka"}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500"
              required
            />
          </div>
          {!isOwner && (
            <div>
              <label htmlFor="regName" className="text-xs text-zinc-500">
                Nama tampilan <span className="text-zinc-600">(opsional)</span>
              </label>
              <input
                id="regName"
                name="regName"
                type="text"
                autoComplete="name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="contoh: Yayan"
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500"
              />
            </div>
          )}

          {error && (
            <p className="text-center text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-2xl bg-amber-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-60"
          >
            {pending ? "Memproses…" : "Masuk"}
          </button>

          {!isOwner && (
            <button
              type="button"
              disabled={registering || pending}
              onClick={() => void onQuickRegister()}
              className="w-full rounded-2xl border border-amber-500/40 bg-zinc-900/60 py-3 text-sm font-semibold text-amber-200 transition hover:border-amber-400/70 hover:bg-zinc-900 disabled:opacity-60"
            >
              {registering ? "Mendaftar…" : "Daftar Baru"}
            </button>
          )}
        </form>

        <div className="mt-5 flex items-center justify-center gap-4 text-xs">
          {isOwner ? (
            <Link
              href="/login?mode=customer"
              className="text-zinc-500 underline-offset-4 hover:underline"
            >
              ← Masuk sebagai pengunjung
            </Link>
          ) : (
            <Link
              href="/login?mode=owner"
              className="text-zinc-500 underline-offset-4 hover:underline"
            >
              Masuk admin toko →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[var(--charcoal)] text-sm text-zinc-500">
          Memuat…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
