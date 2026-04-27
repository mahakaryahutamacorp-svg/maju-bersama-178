import Image from "next/image";
import type { ReactNode } from "react";

type CardProps = {
  title: string;
  imageSrc: string;
  imageAlt: string;
  darkened?: boolean;
  description?: string;
  /** Status operasional (UI saja; data real menyusul). */
  operationalStatus?: "open" | "closed";
  children?: ReactNode;
};

export function Card({
  title,
  imageSrc,
  imageAlt,
  darkened = false,
  description,
  operationalStatus,
  children,
}: CardProps) {
  return (
    <article className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-zinc-900/50 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-md transition hover:border-yellow-500/30">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className={`object-cover transition duration-700 group-hover:scale-110 ${darkened ? "brightness-[0.35]" : "brightness-95"}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 20vw"
        />
        {operationalStatus ? (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white shadow-sm ${operationalStatus === "open" ? "bg-emerald-500" : "bg-red-500"
              }`}
          >
            {operationalStatus === "open" ? "Buka" : "Tutup"}
          </span>
        ) : null}
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent ${darkened ? "bg-black/40" : ""}`}
        />
        <h3 className="absolute bottom-3 left-3 right-3 text-[13px] font-bold leading-tight tracking-tight text-white drop-shadow-lg sm:bottom-4 sm:left-4 sm:text-xl">
          {title}
        </h3>
      </div>
      {children ? (
        <div className="p-2 sm:p-4">
          {description ? (
            <p className="mb-2 line-clamp-1 text-xs text-gray-300">
              {description}
            </p>
          ) : null}
          {children}
        </div>
      ) : null}
    </article>
  );
}
