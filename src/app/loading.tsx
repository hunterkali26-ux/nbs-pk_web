// Global route-transition fallback. Any server-rendered route without its own
// loading.tsx (e.g. /categories/[slug], /products/[id], dynamic admin pages)
// instantly streams this branded shell while data loads, so client-side
// navigation never feels frozen after a click.
//
// Notes:
//  • Purely static markup + CSS-only animations (animate-spin / animate-pulse)
//    — no client JS, no hooks, therefore zero hydration-mismatch risk.
//  • Fixed-height elements and a stable container prevent layout shift when
//    the real page replaces this shell.
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen select-none flex-col items-center justify-center gap-7 bg-slate-50 px-4 py-16 dark:bg-slate-950"
    >
      {/* Brand wordmark — mirrors the footer/auth "VEXIS pk" signature */}
      <p className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
        VEXIS <span className="text-emerald-600 dark:text-emerald-400">pk</span>
      </p>

      {/* Dual-ring loader: crisp emerald orbit over a soft pulsing core */}
      <div aria-hidden="true" className="relative size-14">
        <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent dark:border-emerald-400" />
        <span className="absolute inset-[10px] animate-pulse rounded-full bg-emerald-600/15 dark:bg-emerald-400/15" />
        <span className="absolute inset-[18px] rounded-full bg-emerald-600/25 dark:bg-emerald-400/25" />
      </div>

      {/* Subtle supporting line */}
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Preparing VEXIS pk…
      </p>

      {/* Screen-reader-only status (visual line above is decorative-duplicated) */}
      <span className="sr-only">Loading your experience, please wait.</span>
    </div>
  );
}

