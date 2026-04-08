/**
 * Bentuk data multi-tenant: setiap produk & pesanan memiliki `store_id`.
 * Di Supabase, aktifkan RLS dan policy berdasarkan `store_id` / membership.
 */

export type StoreId = string;

export type ProductRow = {
  id: string;
  store_id: StoreId;
  name: string;
  price: number;
  stock: number;
  created_at: string;
};

export type OrderRow = {
  id: string;
  store_id: StoreId;
  customer_id: string;
  status: "pending" | "paid" | "shipped" | "cancelled";
  total: number;
  created_at: string;
};
