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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://mb178.online";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Maju Bersama 178",
    template: "%s · Maju Bersama 178",
  },
  description:
    "Marketplace multi-toko — katalog, keranjang, dan WhatsApp. Kelola produk & pesanan per toko.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Maju Bersama 178",
    description: "Marketplace multi-toko — Luxury Dark PWA",
    url: "/",
    siteName: "Maju Bersama 178",
    locale: "id_ID",
    type: "website",
    images: [{ url: "/banners/banners01.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maju Bersama 178",
    description: "Marketplace multi-toko",
    images: ["/banners/banners01.jpg"],
  },
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
