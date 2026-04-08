export default function OwnerProductsPlaceholderPage() {
  return (
    <div className="px-4 py-10">
      <h1 className="font-serif text-2xl text-amber-200/90">Edit Produk Saya</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Form CRUD produk dengan filter <code className="text-zinc-400">store_id</code>{" "}
        akan dihubungkan ke Supabase.
      </p>
    </div>
  );
}
