"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { Button } from "@/components/ui/Button";
import type { Mb178ProductRow } from "@/lib/mb178/types";
import type { Mb178StoreRow } from "@/lib/mb178/types";
import { useOwnerStoreScope } from "@/components/owner/owner-store-scope";
import { useAuth } from "@/components/providers/auth-provider";

function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

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
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEditId, setSavingEditId] = useState<string | null>(null);

  const galleryNewRef = useRef<HTMLInputElement>(null);
  const cameraNewRef = useRef<HTMLInputElement>(null);

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
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("name", name.trim());
      fd.set("price", price);
      fd.set("stock", stock);
      fd.set("description", description);
      if (imageFile) fd.set("image", imageFile);
      const res = await fetch(appendApiUrl("/api/owner/products"), {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menambah produk");
        return;
      }
      setName("");
      setPrice("");
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
        Unggah foto ke bucket{" "}
        <code className="text-zinc-400">mb178_assets</code> — data{" "}
        <code className="text-zinc-400">public.products</code>.
      </p>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200/90">
          {error}
        </p>
      ) : null}

      {!connected ? (
        <p className="mt-4 text-sm text-amber-200/70">
          Supabase belum lengkap: pastikan env terisi, jalankan{" "}
          <code className="text-zinc-400">supabase/setup-complete.sql</code>, dan
          isi <code className="text-zinc-400">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          dari Vercel bila perlu.
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
        className="mt-8 scroll-mt-24 space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md"
      >
        <p className="font-serif text-sm text-amber-200/80">Produk baru</p>
        <FloatingLabelInput
          id="p-name"
          name="name"
          label="Nama produk"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <FloatingLabelInput
          id="p-price"
          name="price"
          label="Harga (IDR)"
          type="number"
          min={0}
          step={1}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
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
          required
        />
        <div>
          <label
            htmlFor="p-description"
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Deskripsi (opsional)
          </label>
          <textarea
            id="p-description"
            name="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-zinc-600 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-amber-500"
            placeholder="Tampil di katalog saat pelanggan mengetuk foto produk"
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Foto produk
          </p>
          <p className="mb-3 text-[11px] leading-relaxed text-zinc-600">
            Pilih sumber: galeri file, atau kamera (di HP biasanya membuka kamera
            belakang).
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <input
              ref={galleryNewRef}
              id="p-image-gallery"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                setImageFile(e.target.files?.[0] ?? null);
              }}
            />
            <input
              ref={cameraNewRef}
              id="p-image-camera"
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                setImageFile(e.target.files?.[0] ?? null);
              }}
            />
            <button
              type="button"
              onClick={() => galleryNewRef.current?.click()}
              className="rounded-xl border border-zinc-600 bg-zinc-900/80 px-4 py-2.5 text-sm text-amber-200/95 transition hover:border-amber-500/40"
            >
              Pilih dari galeri
            </button>
            <button
              type="button"
              onClick={() => cameraNewRef.current?.click()}
              className="rounded-xl border border-amber-500/35 bg-amber-950/30 px-4 py-2.5 text-sm font-medium text-amber-100 transition hover:border-amber-400/60"
            >
              Ambil foto (kamera)
            </button>
          </div>
          {imageFile ? (
            <p className="mt-2 text-xs text-zinc-400">
              Terpilih: <span className="text-zinc-200">{imageFile.name}</span>
            </p>
          ) : (
            <p className="mt-2 text-xs text-zinc-600">Belum ada foto dipilih.</p>
          )}
        </div>
        <Button type="submit" disabled={submitting || !connected}>
          {submitting ? "Menyimpan…" : "Simpan & unggah"}
        </Button>
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
