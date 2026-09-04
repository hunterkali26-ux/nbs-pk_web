export function ProductSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Image shimmer */}
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />
      </div>
      {/* Text lines */}
      <div className="space-y-2.5 px-3.5 pb-4 pt-3">
        <div className="h-3.5 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="pt-2">
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}

export function ProductSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}
