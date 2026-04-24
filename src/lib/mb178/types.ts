/** Status pesanan — selaraskan dengan tabel orders dan RPC mb178_checkout. */
export type Mb178OrderStatus =
  | "pending"
  | "pending_payment"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled";

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
  /** Postgres: `numeric(3,2) NOT NULL DEFAULT 4.50` */
  average_rating: number;
  hide_zero_stock_from_catalog: boolean;
  created_at: string;
}

export interface Mb178ProductRow {
  id: string;
  store_id: string;
  name: string;
  /** Postgres `numeric(14,2)` — PostgREST mengembalikan number */
  price: number;
  /** Postgres `integer` */
  stock: number;
  unit: string;
  image_url: string | null;
  /** Kolom DB; bisa tidak ada sebelum migrasi `add-product-description.sql`. */
  description?: string | null;
  category?: string | null;
  created_at: string;
}

export interface Mb178OrderRow {
  id: string;
  store_id: string;
  customer_id: string | null;
  channel: "online" | "offline";
  payment_method: "transfer" | "cod" | "offline";
  status: Mb178OrderStatus;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  /** Postgres `numeric(14,2)` */
  total: number;
  created_at: string;
}

export interface Mb178OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  name_snapshot: string;
  unit_snapshot: string;
  /** Postgres `numeric(14,2)` */
  price_snapshot: number;
  /** Postgres `numeric(14,3)` */
  qty: number;
  line_total: number;
  created_at: string;
}

export interface Mb178BannerRow {
  id: string;
  image_url: string;
  title: string | null;
  is_active: boolean;
  created_at: string;
}
