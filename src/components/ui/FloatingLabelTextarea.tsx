"use client";

import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
};

export function FloatingLabelTextarea({
  id,
  label,
  className = "",
  ...props
}: Props) {
  return (
    <div className="relative">
      <textarea
        id={id}
        placeholder=" "
        rows={4}
        className={`peer w-full rounded-t-lg border-0 border-b border-zinc-600 bg-zinc-900/60 px-3 pb-2 pt-6 text-zinc-100 outline-none transition focus:border-amber-500 focus:ring-0 ${className}`}
        {...props}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-4 text-sm text-zinc-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-amber-400 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs"
      >
        {label}
      </label>
    </div>
  );
}
