import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface Product {
    id?: string;
    store_id: string;
    name: string;
    description: string;
    price: number;
    stock_count: number;
    image_url: string;
    is_visible: boolean;
}

interface ProductState {
    products: Product[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchStoreProducts: (storeId: string) => Promise<void>;
    addProduct: (product: Product, file?: File) => Promise<void>;
    updateProduct: (productId: string, updates: Partial<Product>, file?: File) => Promise<void>;
    deleteProduct: (productId: string) => Promise<void>;
    uploadImage: (file: File) => Promise<string | null>;
}

export const useProductStore = create<ProductState>((set, get) => ({
    products: [],
    isLoading: false,
    error: null,

    // 1. Ambil semua produk milik toko tertentu
    fetchStoreProducts: async (storeId) => {
        set({ isLoading: true });
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (error) set({ error: error.message, isLoading: false });
        else set({ products: data, isLoading: false });
    },

    // 2. Fungsi Helper: Upload Gambar ke Bucket mb178_assets
    uploadImage: async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `product-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('mb178_assets')
            .upload(filePath, file);

        if (uploadError) return null;

        const { data } = supabase.storage
            .from('mb178_assets')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    // 3. Tambah Produk Baru
    addProduct: async (product, file) => {
        set({ isLoading: true });
        let publicUrl = product.image_url;

        if (file) {
            const uploadedUrl = await get().uploadImage(file);
            if (uploadedUrl) publicUrl = uploadedUrl;
        }

        const { data, error } = await supabase
            .from('products')
            .insert([{ ...product, image_url: publicUrl }])
            .select();

        if (error) set({ error: error.message, isLoading: false });
        else {
            set((state) => ({
                products: [data[0], ...state.products],
                isLoading: false
            }));
        }
    },

    // 4. Update Produk (Termasuk stok & visibility toggle)
    updateProduct: async (productId, updates, file) => {
        set({ isLoading: true });
        let finalUpdates = { ...updates };

        if (file) {
            const uploadedUrl = await get().uploadImage(file);
            if (uploadedUrl) finalUpdates.image_url = uploadedUrl;
        }

        const { error } = await supabase
            .from('products')
            .update(finalUpdates)
            .eq('id', productId);

        if (error) set({ error: error.message, isLoading: false });
        else {
            set((state) => ({
                products: state.products.map((p) => (p.id === productId ? { ...p, ...finalUpdates } : p)),
                isLoading: false
            }));
        }
    },

    // 5. Hapus Produk
    deleteProduct: async (productId) => {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) set({ error: error.message });
        else {
            set((state) => ({
                products: state.products.filter((p) => p.id !== productId),
            }));
        }
    },
}));