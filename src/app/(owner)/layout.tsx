import { TopBar } from "@/components/ui/TopBar";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[var(--charcoal)] pb-8 pt-4 text-zinc-100">
      <div className="px-4 md:mx-auto md:max-w-lg">
        <TopBar showAuthButtons={false} />
      </div>
      {children}
    </div>
  );
}
