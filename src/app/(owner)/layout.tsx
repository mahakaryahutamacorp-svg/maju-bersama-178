export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[var(--charcoal)] pb-8 pt-6 text-zinc-100">
      {children}
    </div>
  );
}
