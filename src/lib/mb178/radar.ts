/** Skor 0–100 untuk sumbu radar (performa relatif). */
export function computeRadarAxes(input: {
  totalStock: number;
  orderCount: number;
  /** Rata-rata rating skala 0–5 */
  rating05: number;
}) {
  const stok = Math.min(100, Math.round((input.totalStock / 400) * 100));
  const pesanan = Math.min(100, Math.round((input.orderCount / 30) * 100));
  const rating = Math.min(
    100,
    Math.max(0, Math.round((input.rating05 / 5) * 100))
  );
  return { stok, pesanan, rating };
}
