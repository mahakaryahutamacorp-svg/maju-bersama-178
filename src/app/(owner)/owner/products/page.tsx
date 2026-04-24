"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArchiveBoxIcon,
  BeakerIcon,
  CameraIcon,
  EllipsisHorizontalCircleIcon,
  MicrophoneIcon,
  PhotoIcon,
  SunIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { Button } from "@/components/ui/Button";
import type { Mb178ProductRow } from "@/lib/mb178/types";
import type { Mb178StoreRow } from "@/lib/mb178/types";
import { useOwnerStoreScope } from "@/components/owner/owner-store-scope";
import { useAuth } from "@/components/providers/auth-provider";
import { formatRp } from "@/lib/mb178/format";
import { compressImage } from "@/lib/mb178/image-compress";

type ProductKind = "pupuk" | "alat" | "pestisida" | "benih" | "lainnya";

const KIND_TO_UNIT: Record<ProductKind, string> = {
  pupuk: "karung",
  alat: "pcs",
  pestisida: "botol",
  benih: "pcs",
  lainnya: "pcs",
};

function formatThousandsInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

function parseIdrDisplay(display: string): number {
  const n = Number(display.replace(/\./g, ""));
  return Number.isFinite(n) ? n : 0;
}

function playProductSavedChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.value = 0.12;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + 0.08);
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(784, ctx.currentTime + 0.12);
    osc2.connect(gain);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.28);
    window.setTimeout(() => void ctx.close(), 450);
  } catch {
    /* audio opsional */
  }
}

/** Subset Web Speech API — tipe vendor tidak selalu ada di lib DOM. */
interface OwnerSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: OwnerSpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface OwnerSpeechRecognitionResultEvent {
  resultIndex: number;
  results: Array<{ 0: { transcript: string }; isFinal: boolean }>;
}

function speechRecognitionAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "SpeechRecognition" in window ||
    "webkitSpeechRecognition" in window
  );
}

const KIND_OPTIONS: {
  kind: ProductKind;
  label: string;
  Icon: typeof ArchiveBoxIcon;
}[] = [
    { kind: "pupuk", label: "Pupuk", Icon: ArchiveBoxIcon },
    { kind: "alat", label: "Alat", Icon: WrenchScrewdriverIcon },
    { kind: "pestisida", label: "Obat", Icon: BeakerIcon },
    { kind: "benih", label: "Benih", Icon: SunIcon },
    { kind: "lainnya", label: "Lain", Icon: EllipsisHorizontalCircleIcon },
  ];

export default function OwnerProductsPage() {
  const { user, loading: authLoading, isOwner } = useAuth();
  const { appendApiUrl, ready: storeReady } = useOwnerStoreScope();
  const [store, setStore] = useState<Mb178StoreRow | null>(null);
  const [products, setProducts] = useState<Mb178ProductRow[]>([]);
  const [connected, setConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingVisibility, setSavingVisibility] = useState(false);

  const [name, setName] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const [productKind, setProductKind] = useState<ProductKind>("lainnya");
  const [voiceBusy, setVoiceBusy] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEditId, setSavingEditId] = useState<string | null>(null);

  const galleryNewRef = useRef<HTMLInputElement>(null);
  const cameraNewRef = useRef<HTMLInputElement>(null);
  const speechRef = useRef<OwnerSpeechRecognition | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, pRes] = await Promise.all([
        fetch(appendApiUrl("/api/owner/store")),
        fetch(appendApiUrl("/api/owner/products")),
      ]);
      const sJson = await sRes.json();
      const pJson = await pRes.json();
      if (!sRes.ok)
        setError(
          [sJson.error, sJson.hint].filter(Boolean).join(" — ") ||
          "Gagal memuat toko"
        );
      else {
        setConnected(!!sJson.connected);
        setStore(sJson.store ?? null);
      }
      if (!pRes.ok)
        setError(
          [pJson.error, pJson.hint].filter(Boolean).join(" — ") ||
          "Gagal memuat produk"
        );
      else setProducts(pJson.products ?? []);
    } catch {
      setError("Koneksi gagal");
    } finally {
      setLoading(false);
    }
  }, [appendApiUrl]);

  useEffect(() => {
    if (!authLoading && user && isOwner && storeReady) void refresh();
  }, [authLoading, user, isOwner, storeReady, refresh]);

  async function toggleHideZeroStock(next: boolean) {
    setSavingVisibility(true);
    setError(null);
    try {
      const res = await fetch(appendApiUrl("/api/owner/store"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hide_zero_stock_from_catalog: next }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menyimpan");
        return;
      }
      if (json.store) setStore(json.store as Mb178StoreRow);
    } catch {
      setError("Gagal menyimpan");
    } finally {
      setSavingVisibility(false);
    }
  }

  async function onCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    if (formStep !== 3) return;
    const priceNum = parseIdrDisplay(priceDisplay);
    const stockNum = Number(stock);
    if (
      !name.trim() ||
      Number.isNaN(priceNum) ||
      priceNum < 0 ||
      Number.isNaN(stockNum) ||
      stockNum < 0
    ) {
      setError("Nama, harga, dan stok harus valid");
      setFormStep(2);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("name", name.trim());
      fd.set("price", String(priceNum));
      fd.set("stock", stock);
      fd.set("unit", KIND_TO_UNIT[productKind]);
      fd.set("description", description);
      
      if (imageFile) {
        try {
          const compressed = await compressImage(imageFile, { maxWidth: 1024, quality: 0.75 });
          fd.set("image", compressed, "product.jpg");
        } catch (err) {
          console.error("Compression failed, using original:", err);
          fd.set("image", imageFile);
        }
      }
      const res = await fetch(appendApiUrl("/api/owner/products"), {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menambah produk");
        return;
      }
      playProductSavedChime();
      setFormStep(1);
      setProductKind("lainnya");
      setName("");
      setPriceDisplay("");
      setStock("");
      setDescription("");
      setImageFile(null);
      if (galleryNewRef.current) galleryNewRef.current.value = "";
      if (cameraNewRef.current) cameraNewRef.current.value = "";
      await refresh();
    } catch {
      setError("Gagal menambah produk");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    return () => {
      try {
        speechRef.current?.stop();
      } catch {
        /* */
      }
      speechRef.current = null;
    };
  }, []);

  function toggleDescriptionVoice() {
    if (!speechRecognitionAvailable()) {
      setError("Suara ke teks tidak tersedia di perangkat ini.");
      return;
    }
    if (voiceBusy && speechRef.current) {
      speechRef.current.stop();
      setVoiceBusy(false);
      return;
    }
    setError(null);
    const W = window as Window &
      typeof globalThis & {
        SpeechRecognition?: new () => OwnerSpeechRecognition;
        webkitSpeechRecognition?: new () => OwnerSpeechRecognition;
      };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) {
      setError("Suara ke teks tidak tersedia di perangkat ini.");
      return;
    }
    const rec = new Ctor();
    speechRef.current = rec;
    rec.lang = "id-ID";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (event: OwnerSpeechRecognitionResultEvent) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      const t = text.trim();
      if (t) {
        setDescription((d) => (d.trim() ? `${d.trim()} ${t}` : t));
      }
    };
    rec.onerror = () => {
      setVoiceBusy(false);
    };
    rec.onend = () => {
      setVoiceBusy(false);
    };
    setVoiceBusy(true);
    rec.start();
  }

  function canAdvanceFromStep2() {
    const priceNum = parseIdrDisplay(priceDisplay);
    const stockNum = Number(stock);
    return (
      name.trim().length > 0 &&
      !Number.isNaN(priceNum) &&
      priceNum >= 0 &&
      !Number.isNaN(stockNum) &&
      stockNum >= 0
    );
  }

  async function onDeleteProduct(id: string) {
    if (!confirm("Hapus produk ini?")) return;
    setError(null);
    try {
      const res = await fetch(appendApiUrl(`/api/owner/products/${id}`), {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menghapus");
        return;
      }
      await refresh();
    } catch {
      setError("Gagal menghapus");
    }
  }

  function beginEdit(p: Mb178ProductRow) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPrice(String(p.price));
    setEditStock(String(p.stock));
    setEditDescription(p.description ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function onSaveEdit(id: string) {
    const priceNum = Number(editPrice);
    const stockNum = Number(editStock);
    if (
      !editName.trim() ||
      Number.isNaN(priceNum) ||
      priceNum < 0 ||
      Number.isNaN(stockNum) ||
      stockNum < 0
    ) {
      setError("Nama, harga, dan stok harus valid");
      return;
    }
    setSavingEditId(id);
    setError(null);
    try {
      const res = await fetch(appendApiUrl(`/api/owner/products/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          price: priceNum,
          stock: stockNum,
          description:
            editDescription.trim() === "" ? null : editDescription.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menyimpan");
        return;
      }
      setEditingId(null);
      await refresh();
    } catch {
      setError("Gagal menyimpan");
    } finally {
      setSavingEditId(null);
    }
  }

  async function onReplaceImage(id: string, file: File) {
    setError(null);
    const fd = new FormData();
    fd.set("image", file);
    try {
      const res = await fetch(appendApiUrl(`/api/owner/products/${id}`), {
        method: "PATCH",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal mengunggah gambar");
        return;
      }
      await refresh();
    } catch {
      setError("Gagal mengunggah gambar");
    }
  }

  if (authLoading || (!authLoading && user && isOwner && storeReady && loading)) {
    return (
      <div className="px-4 py-16 text-center text-sm text-zinc-500">
        Memuat…
      </div>
    );
  }

  if (!user || !isOwner) {
    return null;
  }

  if (!storeReady) {
    return (
      <div className="px-4 py-16 text-center text-sm text-zinc-500">
        Memuat konteks toko…
      </div>
    );
  }

  const hideZero = store?.hide_zero_stock_from_catalog ?? false;

  return (
    <div className="px-4 pb-28 pt-4 md:mx-auto md:max-w-lg">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm text-amber-500/90 underline-offset-4 hover:underline"
        >
          ← Dashboard
        </Link>
      </div>

      <h1 className="font-serif text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 md:text-3xl">
        Produk Saya
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Isi bertahap: foto → harga → simpan. Ada bantuan suara untuk deskripsi.
      </p>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200/90">
          {error}
        </p>
      ) : null}

      {!connected ? (
        <p className="mt-4 text-sm text-amber-200/70">
          Supabase belum lengkap: pastikan env terisi, jalankan skrip SQL di{" "}
          <code className="text-zinc-400">supabase/</code>, buat bucket lewat{" "}
          <code className="text-zinc-400">02-storage-mb178-assets.sql</code>, dan
          isi <code className="text-zinc-400">SUPABASE_SERVICE_ROLE_KEY</code> di
          Vercel (Production).
        </p>
      ) : null}

      <section className="mt-8 rounded-3xl border border-amber-500/25 bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-5 shadow-[0_0_40px_rgba(212,175,55,0.12)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-serif text-sm font-medium text-amber-100/90">
              Visibilitas katalog
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Aktifkan untuk menyembunyikan produk berstok{" "}
              <span className="text-zinc-400">0</span> dari halaman pelanggan.
            </p>
          </div>
          <label
            className={`relative h-9 w-[3.25rem] shrink-0 rounded-full border-2 transition ${hideZero
              ? "border-amber-400 bg-gradient-to-r from-amber-600 to-yellow-500 shadow-[0_0_20px_rgba(250,204,21,0.45)]"
              : "border-zinc-600 bg-zinc-800"
              } ${savingVisibility || !connected ? "opacity-50" : ""}`}
            title={
              hideZero
                ? "Aktif: stok 0 disembunyikan"
                : "Nonaktif: stok 0 tetap tampil"
            }
          >
            <input
              type="checkbox"
              role="switch"
              className="sr-only"
              aria-label="Sembunyikan produk stok habis dari katalog pelanggan"
              checked={hideZero}
              disabled={savingVisibility || !connected}
              onChange={() => void toggleHideZeroStock(!hideZero)}
            />
            <span
              aria-hidden
              className={`absolute top-1/2 block h-6 w-6 -translate-y-1/2 rounded-full bg-zinc-950 shadow-md transition-all ${hideZero ? "left-[calc(100%-1.65rem)] bg-amber-50" : "left-1"
                }`}
            />
          </label>
        </div>
      </section>

      <form
        id="owner-product-form"
        onSubmit={(e) => void onCreateProduct(e)}
        className="mt-8 scroll-mt-24 space-y-5 rounded-3xl border border-amber-500/25 bg-gradient-to-b from-zinc-900/70 to-zinc-950/95 p-5 shadow-[0_0_36px_rgba(234,179,8,0.1)] backdrop-blur-md"
      >
        <div className="space-y-2">
          <p className="text-center font-serif text-sm font-medium text-amber-200/90">
            Produk baru
          </p>
          <div
            className="flex gap-1.5"
            role="group"
            aria-label="Kemajuan isian"
          >
            {([1, 2, 3] as const).map((s) => (
              <div
                key={s}
                className={`h-2.5 flex-1 rounded-full transition-all ${formStep >= s
                  ? "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.45)]"
                  : "bg-zinc-700"
                  }`}
              />
            ))}
          </div>
          <p className="text-center text-[11px] font-medium text-zinc-500">
            Langkah {formStep} dari 3
          </p>
        </div>

        {formStep === 1 ? (
          <>
            <input
              ref={galleryNewRef}
              id="p-image-gallery"
              name="image_gallery"
              type="file"
              accept="image/*"
              aria-label="Pilih foto produk dari galeri"
              className="sr-only"
              onChange={(e) => {
                setImageFile(e.target.files?.[0] ?? null);
              }}
            />
            <input
              ref={cameraNewRef}
              id="p-image-camera"
              name="image_camera"
              type="file"
              accept="image/*"
              capture="environment"
              aria-label="Ambil foto produk dengan kamera"
              className="sr-only"
              onChange={(e) => {
                setImageFile(e.target.files?.[0] ?? null);
              }}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => cameraNewRef.current?.click()}
                className="flex min-h-[11rem] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 px-4 py-6 text-zinc-950 shadow-[0_8px_32px_rgba(250,204,21,0.35)] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 sm:min-h-[12rem]"
              >
                <CameraIcon
                  className="h-24 w-24 shrink-0 drop-shadow-md sm:h-28 sm:w-28"
                  aria-hidden
                />
                <span className="text-center text-base font-bold leading-tight">
                  Foto pakai kamera
                </span>
              </button>
              <button
                type="button"
                onClick={() => galleryNewRef.current?.click()}
                className="flex min-h-[11rem] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-zinc-500 bg-zinc-900/50 px-4 py-6 text-zinc-100 transition hover:border-amber-500/50 hover:bg-zinc-900/80 sm:min-h-[12rem]"
              >
                <PhotoIcon
                  className="h-20 w-20 shrink-0 text-amber-400/90"
                  aria-hidden
                />
                <span className="text-center text-sm font-semibold">
                  Ambil dari galeri
                </span>
              </button>
            </div>
            {imageFile ? (
              <p className="text-center text-xs text-amber-200/90">
                Foto siap ✓
              </p>
            ) : (
              <p className="text-center text-[11px] text-zinc-600">
                Foto boleh ditambah nanti — lebih bagus kalau ada.
              </p>
            )}

            <div>
              <p className="mb-2 text-center text-[11px] text-zinc-500">
                Jenis jualan (tap gambar)
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {KIND_OPTIONS.map(({ kind, label, Icon }) => {
                  const selected = productKind === kind;
                  return (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setProductKind(kind)}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 transition ${selected
                        ? "border-amber-400 bg-amber-500/15 shadow-[0_0_16px_rgba(250,204,21,0.2)]"
                        : "border-zinc-600 bg-zinc-900/40 hover:border-amber-500/30"
                        }`}
                    >
                      <Icon
                        className={`h-10 w-10 ${selected ? "text-amber-300" : "text-zinc-400"}`}
                        aria-hidden
                      />
                      <span
                        className={`text-center text-[11px] font-medium leading-tight ${selected ? "text-amber-100" : "text-zinc-500"}`}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setFormStep(2);
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 py-4 text-base font-bold text-zinc-950 shadow-[0_6px_28px_rgba(250,204,21,0.4)] ring-1 ring-amber-300/50 transition hover:brightness-110"
            >
              Lanjut → harga & stok
            </button>
          </>
        ) : null}

        {formStep === 2 ? (
          <>
            <FloatingLabelInput
              id="p-name"
              name="name"
              label="Nama produk"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
            <FloatingLabelInput
              id="p-price"
              name="price"
              label="Harga (ketik angka, jadi Rp otomatis)"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={priceDisplay}
              onChange={(e) =>
                setPriceDisplay(formatThousandsInput(e.target.value))
              }
            />
            <FloatingLabelInput
              id="p-stock"
              name="stock"
              label="Stok"
              type="number"
              min={0}
              step={1}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setFormStep(1);
                }}
                className="rounded-2xl border border-zinc-600 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 sm:shrink-0"
              >
                ← Kembali
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!canAdvanceFromStep2()) {
                    setError("Lengkapi nama, harga, dan stok dulu.");
                    return;
                  }
                  setError(null);
                  setFormStep(3);
                }}
                className="flex-1 rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 py-4 text-base font-bold text-zinc-950 shadow-[0_6px_28px_rgba(250,204,21,0.4)] ring-1 ring-amber-300/50 transition hover:brightness-110"
              >
                Lanjut → deskripsi
              </button>
            </div>
          </>
        ) : null}

        {formStep === 3 ? (
          <>
            <div>
              <label
                htmlFor="p-description"
                className="mb-2 block text-center text-[11px] text-zinc-500"
              >
                Deskripsi (opsional)
              </label>
              <textarea
                id="p-description"
                name="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-amber-500"
                placeholder="Ceritakan singkat… atau pakai tombol mic"
              />
            </div>
            {speechRecognitionAvailable() ? (
              <button
                type="button"
                onClick={() => toggleDescriptionVoice()}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition ${voiceBusy
                  ? "border-amber-500/60 bg-amber-950/40 text-amber-200"
                  : "border-zinc-600 bg-zinc-900/50 text-zinc-200 hover:border-amber-500/40"
                  }`}
              >
                <MicrophoneIcon className="h-6 w-6 text-amber-400" aria-hidden />
                {voiceBusy ? "Dengar… bicara sekarang" : "Bicara → jadi teks"}
              </button>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setFormStep(2);
                }}
                className="rounded-2xl border border-zinc-600 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 sm:shrink-0"
              >
                ← Kembali
              </button>
              <Button
                type="submit"
                className="flex-1 !rounded-2xl !py-4 text-base font-bold shadow-[0_6px_28px_rgba(250,204,21,0.35)]"
                disabled={submitting || !connected}
              >
                {submitting ? "Menyimpan…" : "Simpan ke toko ✓"}
              </Button>
            </div>
          </>
        ) : null}
      </form>

      <section className="mt-10">
        <h2 className="mb-4 font-serif text-lg text-zinc-300">Daftar produk</h2>
        <ul className="space-y-4">
          {products.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-zinc-700 py-10 text-center text-sm text-zinc-500">
              Belum ada produk.
            </li>
          ) : (
            products.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl border border-yellow-600/10 bg-zinc-900/40 p-4"
              >
                <div className="flex gap-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-amber-500/20 bg-zinc-800">
                    {p.image_url ? (
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-xs text-zinc-600">
                        Tanpa foto
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {editingId === p.id ? (
                      <div className="space-y-3">
                        <FloatingLabelInput
                          id={`edit-name-${p.id}`}
                          label="Nama produk"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                        <FloatingLabelInput
                          id={`edit-price-${p.id}`}
                          label="Harga (IDR)"
                          type="number"
                          min={0}
                          step={1}
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                        />
                        <FloatingLabelInput
                          id={`edit-stock-${p.id}`}
                          label="Stok"
                          type="number"
                          min={0}
                          step={1}
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                        />
                        <div>
                          <label
                            htmlFor={`edit-desc-${p.id}`}
                            className="mb-1 block text-xs text-zinc-500"
                          >
                            Deskripsi
                          </label>
                          <textarea
                            id={`edit-desc-${p.id}`}
                            rows={3}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full rounded-xl border border-zinc-600 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            disabled={
                              savingEditId === p.id || !connected
                            }
                            onClick={() => void onSaveEdit(p.id)}
                          >
                            {savingEditId === p.id ? "Menyimpan…" : "Simpan"}
                          </Button>
                          <button
                            type="button"
                            disabled={savingEditId === p.id}
                            onClick={cancelEdit}
                            className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-zinc-100">{p.name}</p>
                        <p className="text-sm text-amber-200/80">
                          {formatRp(p.price)}
                        </p>
                        <p className="text-xs text-zinc-500">Stok: {p.stock}</p>
                        {p.description ? (
                          <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
                            {p.description}
                          </p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => beginEdit(p)}
                            className="text-xs text-amber-500/90 underline-offset-2 hover:underline"
                          >
                            Edit
                          </button>
                          <span className="inline-flex flex-wrap gap-2">
                            <label className="cursor-pointer text-xs text-amber-500/90 underline-offset-2 hover:underline">
                              Galeri
                              <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  e.target.value = "";
                                  if (f) void onReplaceImage(p.id, f);
                                }}
                              />
                            </label>
                            <label className="cursor-pointer text-xs text-amber-500/90 underline-offset-2 hover:underline">
                              Kamera
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="sr-only"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  e.target.value = "";
                                  if (f) void onReplaceImage(p.id, f);
                                }}
                              />
                            </label>
                          </span>
                          <button
                            type="button"
                            onClick={() => void onDeleteProduct(p.id)}
                            className="text-xs text-red-400/90 hover:underline"
                          >
                            Hapus
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
