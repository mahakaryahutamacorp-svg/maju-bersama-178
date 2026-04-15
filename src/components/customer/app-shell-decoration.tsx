"use client";

/**
 * Lapisan latar tetap (gradient + aksen emas) agar seluruh area pelanggan terasa satu "kulit" aplikasi.
 * Tidak memuat gambar berat — hanya CSS.
 * `use client` agar bisa dipakai dari `OwnerShell` juga.
 */
export function AppShellDecoration() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[var(--charcoal)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-15%,rgba(212,175,55,0.14),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_100%_100%,rgba(212,175,55,0.06),transparent_45%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-amber-950/25 via-transparent to-transparent" />
    </div>
  );
}
