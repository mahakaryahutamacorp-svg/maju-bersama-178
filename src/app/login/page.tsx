"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const mode = searchParams.get("mode") ?? "customer"; // customer | owner
  const [email, setEmail] = useState("owner@maju.id");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regName, setRegName] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      setError("User ID/Email atau kata sandi tidak valid.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  async function onQuickRegister() {
    setError(null);
    setRegistering(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: email.trim(), password, name: regName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError([json.error, json.hint].filter(Boolean).join(" — ") || "Gagal daftar");
        return;
      }
      // Auto login setelah daftar
      const login = await signIn("credentials", {
        email,
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

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--charcoal)] px-4">
      <div className="w-full max-w-sm rounded-3xl border border-yellow-600/20 bg-white/5 p-8 backdrop-blur-md">
        <h1 className="font-serif text-center text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">
          {mode === "owner" ? "Masuk Admin Toko" : "Masuk / Daftar Pengunjung"}
        </h1>
        {mode !== "owner" ? (
          <p className="mt-2 text-center text-xs text-zinc-500">
            Pengunjung bisa daftar cepat pakai{" "}
            <span className="text-zinc-400">User ID</span> (tanpa email).
          </p>
        ) : null}
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-xs text-zinc-500">
              User ID / Email
            </label>
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs text-zinc-500">
              Kata sandi
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500"
              required
            />
          </div>
          {mode !== "owner" ? (
            <div>
              <label htmlFor="regName" className="text-xs text-zinc-500">
                Nama (opsional untuk daftar cepat)
              </label>
              <input
                id="regName"
                name="regName"
                type="text"
                autoComplete="name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500"
                placeholder="contoh: Yayan"
              />
            </div>
          ) : null}
          {error ? (
            <p className="text-center text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-2xl bg-amber-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-60"
          >
            {pending ? "Memproses…" : "Masuk"}
          </button>
          {mode !== "owner" ? (
            <button
            type="button"
            disabled={registering || pending}
            onClick={() => void onQuickRegister()}
            className="w-full rounded-2xl border border-amber-500/40 bg-zinc-900/60 py-3 text-sm font-semibold text-amber-200 transition hover:border-amber-400/70 hover:bg-zinc-900 disabled:opacity-60"
          >
            {registering ? "Mendaftar…" : "Daftar cepat (tanpa email)"}
            </button>
          ) : null}
        </form>
        {mode !== "owner" ? (
          <>
            <div className="mt-4 flex items-center justify-between gap-2 text-xs">
              <Link
                href="/login?mode=customer"
                className="text-amber-400 underline-offset-4 hover:underline"
              >
                Masuk pengunjung
              </Link>
              <Link
                href="/login?mode=owner"
                className="text-zinc-500 underline-offset-4 hover:underline"
              >
                Masuk admin toko
              </Link>
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-zinc-500">Contoh customer cepat:</p>
              <button
                type="button"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-black/30"
                onClick={() => {
                  setEmail("yayan12");
                  setPassword("223344");
                  setRegName("Yayan");
                }}
              >
                userId: <span className="text-amber-200">yayan12</span> · password:{" "}
                <span className="text-amber-200">223344</span>
              </button>
            </div>
          </>
        ) : null}
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
