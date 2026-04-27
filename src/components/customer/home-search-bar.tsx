import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface HomeSearchBarProps {
  placeholder?: string;
}

export function HomeSearchBar({
  placeholder = "Cari toko atau produk…",
}: HomeSearchBarProps) {
  return (
    <div className="mt-4">
      <div className="mx-auto w-full max-w-md md:max-w-2xl">
        <label className="group relative block">
          <span className="sr-only">Cari</span>
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-amber-300"
            aria-hidden
          />
          <input
            type="search"
            inputMode="search"
            placeholder={placeholder}
            className="w-full rounded-2xl border border-white/10 bg-[#2A2A2A] py-3 pl-12 pr-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20"
          />
        </label>
      </div>
    </div>
  );
}

