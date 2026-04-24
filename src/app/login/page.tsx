"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { MB178_SCHEMA } from "@/lib/mb178/constants";
import { mb178SupabaseAuthMessage } from "@/lib/mb178/auth-error-message";
import { customerPrincipalToSyntheticEmail, syntheticEmailForMb178LocalPart } from "@/lib/mb178/phone";

function ownerPrincipalToEmail(principal: string) {
  return syntheticEmailForMb178LocalPart(principal.trim().toLowerCase());
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey, { db: { schema: MB178_SCHEMA } });
}

type Mb178BrowserClient = NonNullable<ReturnType<typeof getSupabase>>;

async function userHasStoreAdminRole(
  supabase: Mb178BrowserClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("store_memberships")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["owner", "super_admin"])
    .limit(1);
  return !!data?.length;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "customer";
  const isOwner = mode === "owner";
  /** Admin toko: default ke dashboard agar langsung ke konteks toko (bukan beranda pelanggan). */
  const callbackUrl =
    searchParams.get("callbackUrl")?.trim() ||
    (mode === "owner" ? "/dashboard" : "/");
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
    const supabase = getSupabase();
    if (!supabase) {
      setPending(false);
      setError("Supabase belum dikonfigurasi (env).");
      return;
    }
    let email: string;
    if (isOwner) {
      email = ownerPrincipalToEmail(userId);
    } else {
      const mapped = customerPrincipalToSyntheticEmail(userId);
      if ("error" in mapped) {
        setPending(false);
        setError(mapped.error);
        return;
      }
      email = mapped.email;
    }
    const res = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setPending(false);
    if (res.error) {
      setError(
        mb178SupabaseAuthMessage(
          res.error.message,
          isOwner ? "owner_login" : "customer_login"
        )
      );
      return;
    }
    const uid = res.data.user?.id;
    const goDashboard =
      !!uid &&
      !isOwner &&
      (await userHasStoreAdminRole(supabase, uid));
    router.push(goDashboard ? "/dashboard" : callbackUrl);
    router.refresh();
  }

  async function onQuickRegister() {
    if (!regName.trim()) {
      setError("Isi nama Anda.");
      return;
    }
    if (!/^\d{6}$/.test(password)) {
      setError("Password harus 6 digit angka (contoh: 223344)");
      return;
    }
    const mappedPrincipal = customerPrincipalToSyntheticEmail(userId);
    if ("error" in mappedPrincipal) {
      setError(mappedPrincipal.error);
      return;
    }
    if (mappedPrincipal.phoneDigits62 === null) {
      setError("Untuk daftar baru, gunakan no. HP (contoh: 0812…).");
      return;
    }
    setError(null);
    setRegistering(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setError("Supabase belum dikonfigurasi (env).");
        return;
      }
      const trimmedDisplay = regName.trim();
      const apiRes = await fetch("/api/auth/register-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: userId.trim(),
          password,
          displayName: trimmedDisplay,
        }),
      });
      const apiJson = (await apiRes.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!apiRes.ok) {
        if (apiRes.status === 503) {
          const fallback = await supabase.auth.signUp({
            email: mappedPrincipal.email,
            password,
            options: {
              data: {
                full_name: trimmedDisplay,
                display_name: trimmedDisplay,
                phone: mappedPrincipal.phoneDigits62,
              },
            },
          });
          if (fallback.error) {
            setError(
              mb178SupabaseAuthMessage(fallback.error.message, "register")
            );
            return;
          }
          if (!fallback.data.session) {
            setError(
              "Akun dibuat tetapi belum aktif. Pastikan SUPABASE_SERVICE_ROLE_KEY di server terisi, atau nonaktifkan “Confirm email” di Supabase Auth → Email."
            );
            return;
          }
        } else {
          setError(mb178SupabaseAuthMessage(apiJson.error, "register"));
          return;
        }
      }

      const signed = await supabase.auth.signInWithPassword({
        email: mappedPrincipal.email,
        password,
      });
      if (signed.error) {
        setError(
          mb178SupabaseAuthMessage(signed.error.message, "customer_login")
        );
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
    <div className="relative flex min-h-dvh flex-col md:flex-row">
      <div className="relative h-36 w-full shrink-0 overflow-hidden md:h-auto md:min-h-dvh md:w-[40%] md:max-w-md">
        <Image
          src="/banners/banners02.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 40vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-[var(--charcoal)] md:bg-gradient-to-r md:from-black/55 md:via-black/25 md:to-[var(--charcoal)]" />
        <div className="absolute inset-x-0 bottom-0 p-4 md:inset-auto md:bottom-8 md:left-8 md:right-8 md:p-0">
          <p className="font-serif text-xl font-semibold text-white drop-shadow-md md:text-2xl">
            Maju Bersama 178
          </p>
          <p className="mt-1 text-xs text-zinc-200/90 md:text-sm">
            Marketplace multi-toko — masuk untuk belanja atau kelola toko.
          </p>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center bg-[var(--charcoal)] px-4 py-8 md:py-12">
        <div className="w-full max-w-sm rounded-3xl border border-yellow-600/20 bg-zinc-950/70 p-8 shadow-[0_0_40px_rgba(212,175,55,0.08)] backdrop-blur-md">
          <h1 className="font-serif text-center text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">
            {isOwner ? "Masuk Admin Toko" : "Masuk / Daftar"}
          </h1>
          {!isOwner && (
            <p className="mt-2 text-center text-xs text-zinc-500">
              Daftar langsung aktif: no. HP (08…), nama, PIN 6 angka. Tanpa email & tanpa verifikasi.
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="userId" className="text-xs text-zinc-500">
                {isOwner ? "Username" : "No. HP"}
              </label>
              <input
                id="userId"
                name={isOwner ? "username" : "phone"}
                type={isOwner ? "text" : "tel"}
                autoComplete={isOwner ? "username" : "tel"}
                inputMode={isOwner ? "text" : "tel"}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder={isOwner ? "Ketik username admin (cth: mama01)" : "Ketik no. HP (cth: 0812345678)"}
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
                placeholder={isOwner ? "••••••" : "Ketik 6 angka (cth: 123456)"}
                className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500"
                required
              />
            </div>
            {!isOwner && (
              <div>
                <label htmlFor="regName" className="text-xs text-zinc-500">
                  Nama <span className="text-zinc-600">(untuk daftar baru)</span>
                </label>
                <input
                  id="regName"
                  name="regName"
                  type="text"
                  autoComplete="name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ketik nama asli/panggilan (cth: Yayan)"
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
