import { Suspense } from "react";
import { CartClient } from "./cart-client";

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-16 text-center text-sm text-zinc-500">Memuat keranjang…</div>
      }
    >
      <CartClient />
    </Suspense>
  );
}
