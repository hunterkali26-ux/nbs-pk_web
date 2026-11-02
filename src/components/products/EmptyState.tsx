"use client";

import Link from "next/link";
import { PackageX, ArrowRight, SlidersHorizontal } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function EmptyState({
  title = "No products found",
  message = "We couldn't find any products matching your current filters. Try adjusting your criteria or explore other categories.",
  hasFilters = false,
  onClearFilters,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      {/* Icon */}
      <div className="mb-6 grid size-20 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <PackageX className="size-10 text-slate-400 dark:text-slate-500" strokeWidth={1.2} />
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>

      {/* Message */}
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {message}
      </p>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {hasFilters && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-300 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-amber-600 dark:hover:text-amber-400"
          >
            <SlidersHorizontal className="size-4" />
            Clear Filters
          </button>
        )}
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700 active:scale-95 dark:bg-amber-600 dark:hover:bg-amber-700"
        >
          View All Products
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
