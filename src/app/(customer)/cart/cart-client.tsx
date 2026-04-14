"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { handleCheckout } from "@/app/actions/checkout";
import type { CartLine } from "@/lib/mb178/cart-storage";
import {
  MB178_CART_STORAGE_KEY,
  readCartFromStorage,
  writeCartToStorage,
} from "@/lib/mb178/cart-storage";

function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function groupByStore(lines: CartLine[]) {
  const map = new Map<
    string,
    { store_id: string; store_name: string; store_slug: string; lines: CartLine[] }
  >();
  for (const line of lines) {
    const cur = map.get(line.store_id);
    if (cur) {
      cur.lines.push(line);
    } else {
      map.set(line.store_id, {
        store_id: line.store_id,
        store_name: line.store_name,
        store_slug: line.store_slug,
        lines: [line],
      });
    }
  }
  return [...map.values()];
}

export function CartClient() {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>(() => readCartFromStorage());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reload = useCallback(() => {
    setCart(readCartFromStorage());
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === MB178_CART_STORAGE_KEY) reload();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [reload]);

  const groups = useMemo(() => groupByStore(cart), [cart]);

  function setQty(productId: string, storeId: string, qty: number) {
    const next = cart
      .map((l) =>
        l.product_id === productId && l.store_id === storeId
          ? { ...l, qty: Math.max(1, Math.min(qty, 9999)) }
          : l
      )
      .filter((l) => l.qty > 0);
    writeCartToStorage(next);
    setCart(next);
  }

  function removeLine(productId: string, storeId: string) {
    const next = cart.filter(
      (l) => !(l.product_id === productId && l.store_id === storeId)
    );
    writeCartToStorage(next);
    setCart(next);
  }

  function checkoutStore(storeId: string) {
    setError(null);
    startTransition(async () => {
      const snapshot = readCartFromStorage();
      const block = groupByStore(snapshot).find((g) => g.store_id === storeId);
      if (!block || block.lines.length === 0) {
        setError("Tidak ada item untuk toko ini.");
        return;
      }
      const res = await handleCheckout({
        store_id: block.store_id,
        items: block.lines.map((l) => ({
          product_id: l.product_id,
          qty: l.qty,
        })),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const remaining = snapshot.filter((l) => l.store_id !== storeId);
      writeCartToStorage(remaining);
      setCart(remaining);
      router.push("/orders");
      router.refresh();
    });
  }

  if (cart.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <h1 className="font-serif text-2xl text-amber-200/90">Keranjang</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Belum ada item. Tambahkan dari halaman toko, lalu kembali ke sini untuk checkout.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-amber-400 underline underline-offset-4"
        >
          ← Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 pb-28 md:mx-auto md:max-w-lg">
      <h1 className="font-serif text-2xl text-amber-200/90">Keranjang</h1>
      <p className="mt-1 text-xs text-zinc-500">
        Checkout dilakukan per toko (satu transaksi atomik per pesanan). Anda harus sudah masuk.
      </p>

      {groups.length > 1 ? (
        <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-950/20 px-3 py-2 text-xs text-amber-100/80">
          Anda punya barang dari {groups.length} toko. Selesaikan checkout per blok di bawah.
        </p>
      ) : null}

      {error ? (
        <p
          className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-200/90"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <ul className="mt-6 space-y-8">
        {groups.map((g) => (
          <li
            key={g.store_id}
            className="rounded-2xl border border-yellow-600/15 bg-zinc-900/40 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-medium text-zinc-200">{g.store_name}</h2>
                <p className="text-xs text-zinc-500">
                  <Link
                    href={`/store/${g.store_slug}`}
                    className="text-amber-500/90 underline-offset-2 hover:underline"
                  >
                    Lihat toko
                  </Link>
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => checkoutStore(g.store_id)}
                className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
              >
                {pending ? "…" : "Checkout toko ini"}
              </button>
            </div>
            <ul className="mt-4 space-y-3">
              {g.lines.map((l) => (
                <li
                  key={`${l.store_id}-${l.product_id}`}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-100">{l.name}</p>
                    <p className="text-xs text-zinc-500">
                      {formatRp(l.price)} / {l.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={l.qty}
                      onChange={(e) =>
                        setQty(
                          l.product_id,
                          l.store_id,
                          Number(e.target.value) || 1
                        )
                      }
                      className="w-16 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
                      aria-label={`Jumlah ${l.name}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(l.product_id, l.store_id)}
                      className="text-xs text-red-400/90 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-center text-xs text-zinc-500">
        <Link href="/login?callbackUrl=/cart" className="text-amber-500/90 hover:underline">
          Masuk
        </Link>{" "}
        jika checkout ditolak.
      </p>
    </div>
  );
}
