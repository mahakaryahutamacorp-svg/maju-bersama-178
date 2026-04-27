import { GiftIcon } from "@heroicons/react/24/outline";

export function RewardTicketPromoBanner() {
  return (
    <section className="mt-4">
      <div className="mx-auto w-full max-w-md md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-br from-zinc-950 via-[#17110a] to-amber-950/40 p-4 shadow-[0_0_40px_rgba(212,175,55,0.10)] backdrop-blur-md sm:p-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,rgba(212,175,55,0.18),transparent_60%)]" />
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-500/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-amber-500/10 blur-2xl" />

          <div className="relative flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-500/25 bg-zinc-950/40">
              <GiftIcon className="h-6 w-6 text-amber-300" aria-hidden />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-200/80">
                Reward Tiket Transaksi
              </p>
              <p className="mt-1 font-serif text-base font-semibold leading-snug text-zinc-100 sm:text-lg">
                Kumpulkan Tiket Reward dari Setiap Transaksi!
              </p>
              <p className="mt-2 inline-flex max-w-full items-center rounded-full border border-amber-500/25 bg-zinc-950/35 px-3 py-1 text-[11px] font-medium text-zinc-200/90">
                Pengundian Spesial pada{" "}
                <span className="ml-1 text-amber-200">27 Desember 2026</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

