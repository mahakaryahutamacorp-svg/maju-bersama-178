"use client";

import { useEffect, useMemo, useState } from "react";

const ROTATING_NOTES = [
  "Promo baru muncul tiap hari — cek banner & toko favoritmu.",
  "Tip cepat: buka detail toko lalu chat WhatsApp langsung ke penjual.",
  "Keranjangmu tersimpan otomatis di perangkat ini.",
  "Gunakan pencarian untuk lompat cepat ke produk yang kamu butuhkan.",
] as const;

function getGreeting(hour: number) {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export function LiveMarketPulse() {
  const [now, setNow] = useState(() => new Date());
  const [noteIndex, setNoteIndex] = useState(0);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    const rotator = window.setInterval(() => {
      setNoteIndex((index) => (index + 1) % ROTATING_NOTES.length);
    }, 5000);

    return () => {
      window.clearInterval(clock);
      window.clearInterval(rotator);
    };
  }, []);

  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Jakarta",
      }).format(now),
    [now],
  );

  const jakartaHour = (now.getUTCHours() + 7) % 24;
  const greeting = getGreeting(jakartaHour);

  return (
    <div className="mx-auto mt-4 max-w-3xl rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent p-3 text-left shadow-[0_0_32px_rgba(212,175,55,0.12)] backdrop-blur-sm md:p-4">
      <div className="flex items-center justify-between gap-3 text-xs text-zinc-300 md:text-sm">
        <p className="font-medium text-amber-100">
          {greeting}, waktunya belanja cerdas ✨
        </p>
        <p className="shrink-0 font-mono text-[11px] text-amber-300/90 md:text-xs">
          WIB {formattedTime}
        </p>
      </div>

      <p key={noteIndex} className="mt-2 text-xs text-zinc-300 motion-safe:animate-[fadeSlide_450ms_ease-out] md:text-sm">
        {ROTATING_NOTES[noteIndex]}
      </p>
    </div>
  );
}
