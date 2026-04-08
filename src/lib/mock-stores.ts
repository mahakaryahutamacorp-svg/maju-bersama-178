export type StoreCard = {
  id: string;
  name: string;
  imageSrc: string;
  imageAlt: string;
  darkened: boolean;
  whatsappE164: string;
  storePath: string;
};

/** Mock katalog toko — ganti dengan query Supabase ber-`store_id` saat backend siap */
export const mockStores: StoreCard[] = [
  {
    id: "store-majubersamagrup",
    name: "MAJUBERSAMAGRUP",
    imageSrc:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200&q=80",
    imageAlt: "Tampilan jalan dan etalase toko MAJUBERSAMAGRUP",
    darkened: true,
    whatsappE164: "6281211172228",
    storePath: "/store/majubersamagrup",
  },
  {
    id: "store-pupuk-maju",
    name: "Toko Pupuk MAJU BERSAMA",
    imageSrc:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
    imageAlt: "Tampilan jalan menuju Toko Pupuk MAJU BERSAMA",
    darkened: false,
    whatsappE164: "6281211172228",
    storePath: "/store/pupuk-maju",
  },
];
