export function ProductSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="h-28 w-28 shrink-0 rounded-xl bg-white/5" />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-4 w-3/4 rounded bg-white/5" />
          <div className="h-4 w-1/4 rounded bg-white/5" />
          <div className="h-3 w-1/3 rounded bg-white/5" />
          <div className="mt-4 h-9 w-full rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export function StoreCardSkeleton() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 animate-pulse">
      <div className="aspect-[16/10] w-full rounded-2xl bg-white/5" />
      <div className="mt-4 h-5 w-2/3 rounded bg-white/5" />
      <div className="mt-4 flex gap-2">
        <div className="h-10 flex-1 rounded-xl bg-white/5" />
        <div className="h-10 flex-1 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}
