"use client";

import Link from "next/link";
import { Facebook, Instagram, Music2, Truck } from "lucide-react";

export function Footer() {
  return (
    <footer id="about" className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      {/* Compact mobile grid: side-by-side 2 columns (short scroll), growing
          to 4 across on large screens. */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Link href="/" className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            VEXIS <span className="text-emerald-600">pk</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">
            Premium everyday essentials for the way you show up.
          </p>
          <div className="mt-5 flex gap-2">
            <a
              href="https://instagram.com/vexis.pk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="VEXIS pk on Instagram (opens in a new tab)"
              className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-600 dark:hover:text-white"
            >
              <Instagram className="size-4" />
            </a>
            <a
              href="https://facebook.com/vexis.pk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="VEXIS pk on Facebook (opens in a new tab)"
              className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-600 dark:hover:text-white"
            >
              <Facebook className="size-4" />
            </a>
            <a
              href="https://tiktok.com/@vexis.pk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="VEXIS pk on TikTok (opens in a new tab)"
              className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-600 dark:hover:text-white"
            >
              <Music2 className="size-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Shop</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400">
            <Link className="block transition hover:text-emerald-700 dark:hover:text-emerald-400" href="/shop">All products</Link>
            <Link className="block transition hover:text-emerald-700 dark:hover:text-emerald-400" href="/about">Our story</Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Customer care</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400">
            <a
              href="mailto:hunterkali26@gmail.com"
              className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
            >
              hunterkali26@gmail.com
            </a>
            <a
              href="tel:+923208684757"
              className="block transition hover:text-emerald-700 dark:hover:text-emerald-400"
            >
              03208684757
            </a>
            <p>Mon - Sat, 10am - 6pm</p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <Truck className="size-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Across Pakistan</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Reliable delivery, secure checkout, and support when you need it.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        © 2026 VEXIS pk. All rights reserved.
      </div>
    </footer>
  );
}
