export type Mb178StoreRow = {
  id: string;
  slug: string;
  name: string;
  profile_image_url: string | null;
  address: string | null;
  whatsapp_link: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  average_rating: number | null;
  hide_zero_stock_from_catalog: boolean;
  created_at: string;
};

export type Mb178ProductRow = {
  id: string;
  store_id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  image_url: string | null;
  created_at: string;
};

export type Mb178OrderRow = {
  id: string;
  store_id: string;
  channel: "online" | "offline";
  payment_method: "transfer" | "cod" | "offline";
  status:
  | "pending"
  | "pending_payment"
  | "pending_cod"
  | "booked"
  | "paid"
  | "cancelled"
  | "completed";
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  total: number;
  created_at: string;
};

export type Mb178OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  name_snapshot: string;
  unit_snapshot: string;
  price_snapshot: number;
  qty: number;
  line_total: number;
  created_at: string;
};
