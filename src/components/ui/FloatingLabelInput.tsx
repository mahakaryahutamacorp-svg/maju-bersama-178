"use client";

import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
};

export function FloatingLabelInput({ id, label, className = "", ...props }: Props) {
  return (
    <div className="relative">
      <input
        id={id}
        placeholder=" "
        className={`peer w-full rounded-t-lg border-0 border-b border-zinc-600 bg-zinc-900/60 px-3 pb-2 pt-5 text-zinc-100 outline-none transition focus:border-amber-500 focus:ring-0 ${className}`}
        {...props}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-amber-400 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs"
      >
        {label}
      </label>
    </div>
  );
}
