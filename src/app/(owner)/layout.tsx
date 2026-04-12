import { OwnerShell } from "@/components/owner/owner-shell";

/** Rute owner memakai SessionProvider / client scope; hindari prerender statis yang rapuh di CI. */
export const dynamic = "force-dynamic";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OwnerShell>{children}</OwnerShell>;
}
