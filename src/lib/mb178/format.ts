/** Format angka ke Rupiah: Rp 12.000 */
export function formatRp(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n).replace(/\u00A0/g, "");
}

/** Format tanggal ISO ke id-ID: "24 Apr 2026, 15.30" */
export function formatDateId(iso: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Format jumlah (qty/stok): hilangkan desimal jika .000, mis. 1.500 -> 1.5, 1.000 -> 1 */
export function formatQty(n: number): string {
  return Number(n.toFixed(3)).toString();
}
