/** Key for persisted multi-store cart (client-only). */
export const MB178_CART_STORAGE_KEY = "mb178_cart_v1";

export interface CartLine {
  store_id: string;
  store_slug: string;
  store_name: string;
  product_id: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
}

export function readCartFromStorage(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MB178_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartLine);
  } catch {
    return [];
  }
}

export function writeCartToStorage(lines: CartLine[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MB178_CART_STORAGE_KEY, JSON.stringify(lines));
}

function isCartLine(x: unknown): x is CartLine {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.store_id === "string" &&
    typeof o.store_slug === "string" &&
    typeof o.store_name === "string" &&
    typeof o.product_id === "string" &&
    typeof o.name === "string" &&
    typeof o.unit === "string" &&
    typeof o.price === "number" &&
    typeof o.qty === "number" &&
    o.qty >= 1
  );
}

export function upsertCartLine(line: CartLine): CartLine[] {
  const cart = readCartFromStorage();
  const idx = cart.findIndex(
    (l) => l.store_id === line.store_id && l.product_id === line.product_id
  );
  if (idx >= 0) {
    cart[idx] = {
      ...cart[idx],
      qty: cart[idx].qty + line.qty,
      price: line.price,
      name: line.name,
      unit: line.unit,
      store_name: line.store_name,
      store_slug: line.store_slug,
    };
  } else {
    cart.push({ ...line });
  }
  writeCartToStorage(cart);
  return cart;
}
