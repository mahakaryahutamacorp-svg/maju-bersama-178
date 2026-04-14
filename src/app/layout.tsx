import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Maju Bersama 178 — Marketplace Multi-Toko",
    template: "%s | Maju Bersama 178",
  },
  description:
    "Marketplace multi-toko terpercaya — belanja pupuk, kosmetik, gadget, makanan, dan layanan perjalanan dalam satu platform. Luxury Dark PWA.",
  manifest: "/manifest.json",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://mb178.online"
  ),
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Maju Bersama 178",
    title: "Maju Bersama 178 — Marketplace Multi-Toko",
    description:
      "Belanja dari 8 toko terpilih dalam satu platform premium. Pupuk, kosmetik, gadget, makanan, dan lainnya.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Maju Bersama 178",
    description: "Marketplace multi-toko premium — Luxury Dark PWA",
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Maju Bersama 178",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${playfair.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-dvh bg-[var(--charcoal)] font-sans text-zinc-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
