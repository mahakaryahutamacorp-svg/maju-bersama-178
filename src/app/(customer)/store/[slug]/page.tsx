type Props = { params: Promise<{ slug: string }> };

export default async function StorePlaceholderPage({ params }: Props) {
  const { slug } = await params;
  return (
    <div className="px-4 py-10 text-center">
      <h1 className="font-serif text-2xl text-amber-200/90">Toko</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Halaman katalog untuk <code className="text-zinc-400">{slug}</code>{" "}
        (placeholder).
      </p>
    </div>
  );
}
