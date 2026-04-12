"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { MapPinIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { FloatingLabelTextarea } from "@/components/ui/FloatingLabelTextarea";
import { Button } from "@/components/ui/Button";
import type { Mb178StoreRow } from "@/lib/mb178/types";
import { useOwnerStoreScope } from "@/components/owner/owner-store-scope";

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
  const { appendApiUrl, ready: storeReady } = useOwnerStoreScope();
  const [mapOpen, setMapOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);

  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [lat, setLat] = useState(defaultLat);
  const [lng, setLng] = useState(defaultLng);

  const loadStore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(appendApiUrl("/api/owner/store"));
      const json = await res.json();
      if (!res.ok) {
        setError(
          [json.error, json.hint].filter(Boolean).join(" — ") || "Gagal memuat"
        );
        return;
      }
      setConnected(!!json.connected);
      const s = json.store as Mb178StoreRow | null;
      if (s) {
        setStoreName(s.name ?? "");
        setAddress(s.address ?? "");
        setWhatsappLink(s.whatsapp_link ?? "");
        if (s.lat != null) setLat(s.lat);
        if (s.lng != null) setLng(s.lng);
      }
    } catch {
      setError("Gagal memuat");
    } finally {
      setLoading(false);
    }
  }, [appendApiUrl]);

  useEffect(() => {
    if (status === "authenticated" && storeReady) void loadStore();
  }, [status, storeReady, loadStore]);

  async function onSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(appendApiUrl("/api/owner/store"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: storeName.trim(),
          address: address.trim(),
          whatsapp_link: whatsappLink.trim(),
          lat,
          lng,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          [json.error, json.hint].filter(Boolean).join(" — ") ||
            "Gagal menyimpan"
        );
        return;
      }
      setMessage("Perubahan disimpan.");
      if (json.store) {
        const s = json.store as Mb178StoreRow;
        setStoreName(s.name ?? "");
        setAddress(s.address ?? "");
        setWhatsappLink(s.whatsapp_link ?? "");
      }
    } catch {
      setError("Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || (status === "authenticated" && storeReady && loading)) {
    return (
      <div className="px-4 py-16 text-center text-sm text-zinc-500">
        Memuat…
      </div>
    );
  }

  if (!session?.user || (session.user.role !== "owner" && session.user.role !== "super_admin")) {
    return null;
  }

  if (session.user.role === "owner" && !session.user.storeId) {
    return (
      <div className="px-4 py-16 text-center text-sm text-zinc-500">
        Menunggu penautan toko…
      </div>
    );
  }

  if (status === "authenticated" && !storeReady) {
    return (
      <div className="px-4 py-16 text-center text-sm text-zinc-500">
        Memuat konteks toko…
      </div>
    );
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
        Identitas toko tersimpan di schema{" "}
        <code className="text-zinc-400">mb178.stores</code>
        {connected ? "" : " (offline — periksa env & SQL)"}.
      </p>

      {message ? (
        <p className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200/90">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200/90">
          {error}
        </p>
      ) : null}

      <form
        className="mt-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          void onSave();
        }}
      >
        <FloatingLabelInput
          id="storeName"
          name="storeName"
          label="Nama Toko"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          autoComplete="organization"
        />
        <FloatingLabelTextarea
          id="address"
          name="address"
          label="Alamat lengkap"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <FloatingLabelInput
          id="whatsapp"
          name="whatsapp"
          label="Link WhatsApp (URL, contoh https://wa.me/62812…)"
          value={whatsappLink}
          onChange={(e) => setWhatsappLink(e.target.value)}
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

        <Button type="submit" disabled={saving || !connected}>
          {saving ? "Menyimpan…" : "Simpan ke database"}
        </Button>
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
    </div>
  );
}
