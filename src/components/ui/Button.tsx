import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "toko" | "whatsapp" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  toko: "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-zinc-950 font-semibold shadow-[0_0_24px_rgba(212,175,55,0.35)] hover:brightness-110 active:scale-[0.98]",
  whatsapp:
    "bg-gradient-to-r from-emerald-600 to-lime-400 text-zinc-950 font-semibold shadow-[0_0_20px_rgba(52,211,153,0.35)] hover:brightness-110 active:scale-[0.98]",
  ghost:
    "border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
};

const base =
  "inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 py-2.5 text-sm transition";

export function buttonClass(
  variant: ButtonVariant = "toko",
  className = ""
) {
  return `${base} ${variants[variant]} ${className}`;
}

export function Button({
  variant = "toko",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, className)}
      {...props}
    />
  );
}
