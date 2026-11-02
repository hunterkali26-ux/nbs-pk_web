"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { X, Smartphone } from "lucide-react";

const DISMISS_KEY = "nbs-app-banner-dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function MobileAppBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check localStorage — only run on client after hydration.
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const elapsed = Date.now() - parseInt(dismissedAt, 10);
        if (elapsed < DISMISS_DURATION_MS) return; // Still dismissed
      }
      setVisible(true);
    } catch {
      // localStorage unavailable (private browsing) — show banner.
      setVisible(true);
    }
  }, []);

  const handleClose = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      // Silently fail if localStorage is unavailable.
    }
  };

  if (!visible) return null;

  return (
    <div
      role="complementary"
      aria-label="Mobile app promotion"
      // Mobile-only: hidden at md (768px+) breakpoint, matches the project's
      // mobile-first pattern. Fixed above the bottom nav (68px tall).
      className="fixed inset-x-0 bottom-[68px] z-40 px-3 pb-2 md:hidden"
    >
      <div className="mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-600 to-teal-600 px-4 py-3.5 shadow-xl shadow-amber-900/20 dark:border-amber-800 dark:from-amber-700 dark:to-teal-700">
        {/* App icon */}
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/20 backdrop-blur-sm">
          <Smartphone className="size-6 text-white" strokeWidth={2} />
        </span>

        {/* Copy */}
        <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-white">
          Experience Vexis faster on our Mobile App! 🚀
        </p>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href="/download-app"
            className="rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-amber-700 shadow-sm transition hover:bg-amber-50 active:scale-95"
          >
            Download App
          </Link>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close promotion banner"
            className="grid size-8 place-items-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white active:scale-95"
          >
            <X className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
