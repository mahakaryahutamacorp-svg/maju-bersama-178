import { Navigation } from "@/components/ui/Navigation";
import { TopBar } from "@/components/ui/TopBar";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--charcoal)] pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <main className="flex-1 px-4 pt-4 md:mx-auto md:w-full md:max-w-4xl">
        <TopBar />
        <div className="-mx-4 md:mx-0">{children}</div>
      </main>
      <Navigation />
    </div>
  );
}
