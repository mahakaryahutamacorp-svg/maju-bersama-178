"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { MapPinIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { FloatingLabelTextarea } from "@/components/ui/FloatingLabelTextarea";
import { Button } from "@/components/ui/Button";

const LocationMapPicker = dynamic(
  () =>
    import("@/components/owner/location-map-picker").then((m) => ({
      default: m.LocationMapPicker,
    })),
  {
    ssr: false,
    loading: () => (
      <p className="py-8 text-center text-sm text-zinc-500">Memuat peta…</p>
    ),
  }
);

const defaultLat = -6.2088;
const defaultLng = 106.8456;

export default function OwnerSettingsPage() {
  const { data: session, status } = useSession();
  const [mapOpen, setMapOpen] = useState(false);
  const [lat, setLat] = useState(defaultLat);
  const [lng, setLng] = useState(defaultLng);

  if (status === "loading") {
    return (
      <div className="px-4 py-16 text-center text-sm text-zinc-500">
        Memuat…
      </div>
    );
  }

  if (!session?.user || session.user.role !== "owner") {
    return null;
  }

  return (
    <div className="relative px-4 pb-28 pt-4 md:mx-auto md:max-w-lg">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm text-amber-500/90 underline-offset-4 hover:underline"
        >
          ← Dashboard
        </Link>
      </div>

      <h1 className="font-serif text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 md:text-3xl">
        Pengaturan Toko
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Kelola identitas toko — data disimpan lokal di browser untuk demo.
      </p>

      <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
        <FloatingLabelInput
          id="storeName"
          name="storeName"
          label="Nama Toko"
          defaultValue="Toko Pupuk MAJU BERSAMA"
          autoComplete="organization"
        />
        <FloatingLabelTextarea
          id="description"
          name="description"
          label="Deskripsi"
          defaultValue="Supplier pupuk dan pertanian terpercaya — Maju Bersama 178."
        />
        <FloatingLabelInput
          id="phone"
          name="phone"
          type="tel"
          label="No. Telp"
          defaultValue="+62-812-1117-2228"
          autoComplete="tel"
        />
        <FloatingLabelInput
          id="whatsapp"
          name="whatsapp"
          label="Link WhatsApp / @username"
          defaultValue="@majubersama178"
        />
        <FloatingLabelTextarea
          id="address"
          name="address"
          label="Alamat Lengkap"
          defaultValue="Jl. Contoh No. 178, Jakarta"
        />

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Lokasi di peta
          </p>
          <p className="text-sm text-zinc-400">
            Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
          </p>
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-zinc-900/80 px-4 py-2.5 text-sm text-amber-200 transition hover:border-amber-400/50"
          >
            <MapPinIcon className="h-5 w-5" aria-hidden />
            Buka peta (Mapbox Dark)
          </button>
        </div>
      </form>

      {mapOpen ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Pilih lokasi toko"
        >
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setMapOpen(false)}
              className="rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
              aria-label="Tutup"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto rounded-2xl">
            <LocationMapPicker
              latitude={lat}
              longitude={lng}
              onChange={(nextLat, nextLng) => {
                setLat(nextLat);
                setLng(nextLng);
              }}
              onClose={() => setMapOpen(false)}
            />
          </div>
          <Button
            type="button"
            variant="toko"
            className="mt-4"
            onClick={() => setMapOpen(false)}
          >
            Selesai
          </Button>
        </div>
      ) : null}

      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          className="pointer-events-auto w-full rounded-2xl bg-amber-500 py-4 text-center text-sm font-semibold text-zinc-950 shadow-[0_8px_32px_rgba(245,158,11,0.45)] transition hover:bg-amber-400"
        >
          Simpan Perubahan
        </button>
      </div>
    </div>
  );
}
