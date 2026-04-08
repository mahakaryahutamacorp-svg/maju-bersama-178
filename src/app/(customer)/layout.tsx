import { Navigation } from "@/components/ui/Navigation";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--charcoal)] pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <main className="flex-1">{children}</main>
      <Navigation />
    </div>
  );
}
