/** Role anggota toko — selaras dengan enum `public.store_role`. */
export type Mb178StoreRole = "customer" | "owner" | "super_admin";

/** Satu baris `public.store_memberships`. */
export interface Mb178StoreMembershipRow {
  id: string;
  user_id: string;
  store_id: string;
  role: Mb178StoreRole;
  created_at: string;
}

/** Satu baris `public.profiles` (1:1 dengan `auth.users`). */
export interface Mb178ProfileRow {
  id: string;
  full_name: string | null;
  created_at: string;
}

/** Satu baris `public.stores` — selaras dengan `supabase/setup-complete.sql`. */
export interface Mb178StoreRow {
  id: string;
  slug: string;
  name: string;
  profile_image_url: string | null;
  address: string | null;
  whatsapp_link: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  /** `numeric(3,2) NOT NULL` di DB; PostgREST mengembalikan angka. */
  average_rating: number;
  hide_zero_stock_from_catalog: boolean;
  created_at: string;
}

/** Satu baris `public.products`. */
export interface Mb178ProductRow {
  id: string;
  store_id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  image_url: string | null;
  description: string | null;
  created_at: string;
}

/**
 * Status pesanan di DB bertipe `text` (bukan enum Postgres).
 * Daftar ini mencakup nilai yang dipakai UI / seed; nilai lain tetap valid di DB.
 */
export type Mb178OrderStatus =
  | "pending"
  | "pending_payment"
  | "pending_cod"
  | "booked"
  | "paid"
  | "shipped"
  | "cancelled"
  | "completed";

export type Mb178OrderChannel = string;
export type Mb178OrderPaymentMethod = string;

/** Satu baris `public.orders` (+ `customer_id` dari migrasi auth-native). */
export interface Mb178OrderRow {
  id: string;
  store_id: string;
  channel: Mb178OrderChannel;
  payment_method: Mb178OrderPaymentMethod;
  status: Mb178OrderStatus | string;
  /** Ditambahkan migrasi `20260414103100_auth_native_schema.sql`. */
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  total: number;
  created_at: string;
}

/** Satu baris `public.order_items` — `qty` bertipe `numeric(14,3)` di DB. */
export interface Mb178OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  name_snapshot: string;
  unit_snapshot: string;
  price_snapshot: number;
  qty: number;
  line_total: number;
  created_at: string;
}

/** Satu baris `public.banners`. */
export interface Mb178BannerRow {
  id: string;
  image_url: string;
  title: string | null;
  is_active: boolean;
  created_at: string;
}
