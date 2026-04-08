import Image from "next/image";
import type { ReactNode } from "react";

type CardProps = {
  title: string;
  imageSrc: string;
  imageAlt: string;
  darkened?: boolean;
  children?: ReactNode;
};

export function Card({
  title,
  imageSrc,
  imageAlt,
  darkened = false,
  children,
}: CardProps) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-yellow-600/20 bg-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md transition hover:border-yellow-500/30">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className={`object-cover transition duration-500 group-hover:scale-105 ${darkened ? "brightness-[0.45]" : "brightness-90"}`}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent ${darkened ? "bg-black/30" : ""}`}
        />
        <h3 className="font-serif absolute bottom-3 left-3 right-3 text-lg font-semibold tracking-wide text-white drop-shadow-md md:text-xl">
          {title}
        </h3>
      </div>
      {children ? (
        <div className="flex flex-col gap-3 p-4">{children}</div>
      ) : null}
    </article>
  );
}
