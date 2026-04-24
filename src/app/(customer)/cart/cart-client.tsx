"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/Button";
import {
  MB178_CART_STORAGE_KEY,
  clearCartStore,
  readCartSnapshot,
  removeCartLine,
  updateCartLineQty,
  type CartLine,
  type CartSnapshot,
} from "@/lib/mb178/cart-storage";
import { safeCatalogImageUrl } from "@/lib/mb178/safe-remote-image";
import { checkoutCartAction } from "./checkout-action";

function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

interface StoreGroup {
  storeId: string;
  storeSlug: string;
  lines: CartLine[];
}

function groupLinesByStore(lines: CartLine[]): StoreGroup[] {
  const map = new Map<string, StoreGroup>();
  for (const line of lines) {
    const key = line.storeId;
    const cur = map.get(key);
    if (cur) cur.lines.push(line);
    else map.set(key, { storeId: line.storeId, storeSlug: line.storeSlug, lines: [line] });
  }
  return Array.from(map.values());
}

interface CheckoutBlockProps {
  group: StoreGroup;
  supabaseOrigin: string | undefined;
  signedIn: boolean;
  onCartChanged: () => void;
}

function CheckoutStoreBlock({
  group,
  supabaseOrigin,
  signedIn,
  onCartChanged,
}: CheckoutBlockProps) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "cod" | "offline">(
    "transfer",
  );
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linesPayload = useMemo(
    () => group.lines.map((l) => ({ productId: l.productId, qty: l.qty })),
    [group.lines],
  );

  async function onPay() {
    setError(null);
    if (!signedIn) {
      setError("Silakan masuk untuk melanjutkan.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Nama dan nomor telepon wajib diisi.");
      return;
    }
    setPending(true);
    const res = await checkoutCartAction({
      storeId: group.storeId,
      paymentMethod,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      notes: notes.trim(),
      lines: linesPayload,
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    clearCartStore(group.storeId);
    onCartChanged();
    router.push("/orders");
    router.refresh();
  }

  return (
    <section className="mb-10 rounded-2xl border border-yellow-600/15 bg-zinc-900/40 p-4">
      <h2 className="font-serif text-lg text-amber-200/90">
        <Link href={`/store/${group.storeSlug}`} className="underline-offset-4 hover:underline">
          Toko: {group.storeSlug}
        </Link>
      </h2>
      <ul className="mt-4 space-y-3">
        {group.lines.map((line) => (
          <li
            key={`${line.storeId}-${line.productId}`}
            className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
              {line.imageUrl ? (
                <Image
                  src={safeCatalogImageUrl(line.imageUrl, supabaseOrigin)}
                  alt={line.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <span className="flex h-full items-center justify-center px-1 text-center text-[10px] text-zinc-500">
                  {line.name}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-100">{line.name}</p>
              <p className="text-xs text-amber-200/80">{formatRp(line.price)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="text-[11px] text-zinc-500" htmlFor={`qty-${line.storeId}-${line.productId}`}>
                  Qty
                  <input
                    id={`qty-${line.storeId}-${line.productId}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    title="Jumlah"
                    className="ml-1 w-16 rounded border border-zinc-600 bg-zinc-900 px-1 py-0.5 text-xs text-zinc-100"
                    value={line.qty}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      updateCartLineQty(line.productId, line.storeId, v);
                      onCartChanged();
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="text-[11px] text-red-400/90 underline-offset-2 hover:underline"
                  onClick={() => {
                    removeCartLine(line.productId, line.storeId);
                    onCartChanged();
                  }}
                >
                  Hapus
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
        <p className="text-sm text-zinc-400">
          Subtotal:{" "}
          <span className="font-semibold text-amber-200/90">
            {formatRp(group.lines.reduce((s, l) => s + l.price * l.qty, 0))}
          </span>
        </p>
        <div>
          <label htmlFor={`checkout-name-${group.storeId}`} className="text-xs text-zinc-500">
            Nama
          </label>
          <input
            id={`checkout-name-${group.storeId}`}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100"
            autoComplete="name"
            placeholder="Nama lengkap"
          />
        </div>
        <div>
          <label htmlFor={`checkout-phone-${group.storeId}`} className="text-xs text-zinc-500">
            Telepon / WhatsApp
          </label>
          <input
            id={`checkout-phone-${group.storeId}`}
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100"
            inputMode="tel"
            autoComplete="tel"
            placeholder="08…"
          />
        </div>
        <div>
          <label htmlFor={`checkout-pay-${group.storeId}`} className="text-xs text-zinc-500">
            Metode bayar
          </label>
          <select
            id={`checkout-pay-${group.storeId}`}
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value as "transfer" | "cod" | "offline")
            }
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100"
            aria-label="Metode pembayaran"
          >
            <option value="transfer">Transfer</option>
            <option value="cod">COD</option>
            <option value="offline">Offline / toko</option>
          </select>
        </div>
        <div>
          <label htmlFor={`checkout-notes-${group.storeId}`} className="text-xs text-zinc-500">
            Catatan (opsional)
          </label>
          <textarea
            id={`checkout-notes-${group.storeId}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100"
            placeholder="Alamat pengiriman, waktu, dll."
          />
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3">
          <p className="text-xs leading-relaxed text-amber-200/90">
            <strong className="font-semibold text-amber-400">Info Pembayaran:</strong> Pembayaran dan pengiriman menggunakan Cash atau Transfer (via no. rekening yang akan dikirim via WhatsApp), serta opsi COD atau dikirim oleh kurir toko.
          </p>
        </div>
        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="button" disabled={pending} onClick={() => void onPay()}>
          {pending ? "Memproses…" : "Bayar / Pesan"}
        </Button>
      </div>
    </section>
  );
}

export function CartClient() {
  const { user, loading: authLoading } = useAuth();
  const [snap, setSnap] = useState<CartSnapshot>(() => readCartSnapshot());
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const refresh = useCallback(() => {
    setSnap(readCartSnapshot());
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === MB178_CART_STORAGE_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const groups = useMemo(() => groupLinesByStore(snap.lines), [snap.lines]);

  if (authLoading) {
    return <p className="py-10 text-center text-sm text-zinc-500">Memuat…</p>;
  }

  return (
    <div className="px-4 py-8 md:mx-auto md:max-w-lg">
      <h1 className="font-serif text-2xl text-amber-200/90">Keranjang</h1>
      {!user ? (
        <p className="mt-3 text-sm text-zinc-500">
          <Link href="/login" className="text-amber-400 underline underline-offset-4">
            Masuk
          </Link>{" "}
          untuk checkout. Anda tetap bisa menambah barang dari halaman toko.
        </p>
      ) : null}

      {snap.lines.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-zinc-700 py-10 text-center text-sm text-zinc-500">
          Keranjang kosong. Buka{" "}
          <Link href="/" className="text-amber-400 underline underline-offset-4">
            beranda
          </Link>{" "}
          dan pilih toko.
        </p>
      ) : (
        groups.map((g) => (
          <CheckoutStoreBlock
            key={g.storeId}
            group={g}
            supabaseOrigin={supabaseOrigin}
            signedIn={!!user}
            onCartChanged={refresh}
          />
        ))
      )}
    </div>
  );
}
