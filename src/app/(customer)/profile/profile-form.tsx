"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { Button } from "@/components/ui/Button";

interface ProfileFormProps {
  initialDisplayName: string;
}

export function ProfileForm({ initialDisplayName }: ProfileFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          ...(pin ? { password: pin } : {}),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: json.error || "Gagal memperbarui profil." });
      } else {
        setMessage({ type: "success", text: "Profil berhasil diperbarui!" });
        setPin("");
        router.refresh();
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan koneksi." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div className="space-y-4">
        <FloatingLabelInput
          label="Nama Lengkap"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
        <div className="space-y-1">
          <FloatingLabelInput
            label="PIN Baru (Kosongkan jika tidak ingin diubah)"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            minLength={4}
          />
          <p className="text-[10px] text-zinc-500 px-1">Minimal 4 digit angka/karakter.</p>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl border p-3 text-xs ${
            message.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Menyimpan…" : "Simpan Perubahan"}
      </Button>
    </form>
  );
}
