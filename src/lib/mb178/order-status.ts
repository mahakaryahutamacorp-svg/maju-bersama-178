import type { Mb178OrderStatus } from "@/lib/mb178/types";

export function labelOrderStatus(status: string): string {
  const map: Record<Mb178OrderStatus, string> = {
    pending_payment: "Menunggu pembayaran",
    processing: "Diproses",
    shipped: "Dikirim",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };
  return map[status as Mb178OrderStatus] ?? status;
}
