/** Keranjang sementara (client-only). Jangan impor dari Server Components. */

export const MB178_CART_STORAGE_KEY = "mb178_cart_v1" as const;

export interface CartLine {
  productId: string;
  storeId: string;
  storeSlug: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
  imageUrl: string | null;
}

export interface CartSnapshot {
  lines: CartLine[];
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readCartSnapshot(): CartSnapshot {
  if (!isBrowser()) return { lines: [] };
  try {
    const raw = window.localStorage.getItem(MB178_CART_STORAGE_KEY);
    if (!raw) return { lines: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || !("lines" in parsed)) {
      return { lines: [] };
    }
    const lines = (parsed as { lines: unknown }).lines;
    if (!Array.isArray(lines)) return { lines: [] };
    const out: CartLine[] = [];
    for (const row of lines) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const productId = typeof r.productId === "string" ? r.productId : "";
      const storeId = typeof r.storeId === "string" ? r.storeId : "";
      const storeSlug = typeof r.storeSlug === "string" ? r.storeSlug : "";
      const name = typeof r.name === "string" ? r.name : "";
      const unit = typeof r.unit === "string" ? r.unit : "pcs";
      const price = typeof r.price === "number" && !Number.isNaN(r.price) ? r.price : 0;
      const qty = typeof r.qty === "number" && r.qty > 0 ? Math.floor(r.qty) : 0;
      const imageUrl = typeof r.imageUrl === "string" || r.imageUrl === null ? (r.imageUrl as string | null) : null;
      if (!productId || !storeId || !storeSlug || !name || qty < 1) continue;
      out.push({ productId, storeId, storeSlug, name, unit, price, qty, imageUrl });
    }
    return { lines: out };
  } catch {
    return { lines: [] };
  }
}

export function writeCartSnapshot(snap: CartSnapshot): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(MB178_CART_STORAGE_KEY, JSON.stringify({ lines: snap.lines }));
}

export function addOrMergeCartLine(line: CartLine): void {
  const snap = readCartSnapshot();
  const idx = snap.lines.findIndex(
    (l) => l.productId === line.productId && l.storeId === line.storeId,
  );
  if (idx >= 0) {
    snap.lines[idx] = {
      ...snap.lines[idx],
      qty: snap.lines[idx].qty + line.qty,
      price: line.price,
      name: line.name,
      unit: line.unit,
      imageUrl: line.imageUrl,
    };
  } else {
    snap.lines.push({ ...line });
  }
  writeCartSnapshot(snap);
}

export function updateCartLineQty(productId: string, storeId: string, qty: number): void {
  const snap = readCartSnapshot();
  const q = Math.max(0, Math.floor(qty));
  if (q === 0) {
    snap.lines = snap.lines.filter((l) => !(l.productId === productId && l.storeId === storeId));
  } else {
    const line = snap.lines.find((l) => l.productId === productId && l.storeId === storeId);
    if (line) line.qty = q;
  }
  writeCartSnapshot(snap);
}

export function removeCartLine(productId: string, storeId: string): void {
  const snap = readCartSnapshot();
  snap.lines = snap.lines.filter((l) => !(l.productId === productId && l.storeId === storeId));
  writeCartSnapshot(snap);
}

export function clearCartStore(storeId: string): void {
  const snap = readCartSnapshot();
  snap.lines = snap.lines.filter((l) => l.storeId !== storeId);
  writeCartSnapshot(snap);
}
