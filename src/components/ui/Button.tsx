import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "toko" | "whatsapp" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  toko: "bg-gradient-to-r from-[#f59e0b] via-[#fbbf24] to-[#f59e0b] text-zinc-950 font-bold shadow-[0_4px_16px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-[0.96]",
  whatsapp:
    "bg-gradient-to-r from-[#059669] to-[#84cc16] text-white font-bold shadow-[0_4px_16px_rgba(5,150,105,0.4)] hover:brightness-110 active:scale-[0.96]",
  ghost:
    "border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
};

const base =
  "inline-flex items-center justify-center rounded-xl transition-all duration-200";

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
