"use client";

import Link from "next/link";
import { Facebook, Instagram, Truck } from "lucide-react";

export function Footer() {
  return (
    <footer id="about" className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      {/* Compact mobile grid: side-by-side 2 columns (short scroll), growing
          to 4 across on large screens. */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Link href="/" className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            NBS <span className="text-amber-600">pk</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">
            Premium leather shoes, handcrafted in Multan since 2015.
          </p>
          <div className="mt-5 flex gap-2">
            <a
              href="https://www.instagram.com/newbrandshoesmultan/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NBS-pk on Instagram (opens in a new tab)"
              className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-amber-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-amber-600 dark:hover:text-white"
            >
              <Instagram className="size-4" />
            </a>
            <a
              href="https://facebook.com/share/18q9SFsahk/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NBS-pk on Facebook (opens in a new tab)"
              className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-amber-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-amber-600 dark:hover:text-white"
            >
              <Facebook className="size-4" />
            </a>
            <a
              href="https://www.tiktok.com/@newbrandshoesmultan"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NBS-pk on TikTok (opens in a new tab)"
              className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-amber-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-amber-600 dark:hover:text-white"
            >
              {/* Perfect Proportional TikTok SVG Icon */}
              <svg
                className="size-4 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002-.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.836 4.836 0 0 1-1.003-.104z" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Shop</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400">
            <Link className="block transition hover:text-amber-700 dark:hover:text-amber-400" href="/shop">All products</Link>
            <Link className="block transition hover:text-amber-700 dark:hover:text-amber-400" href="/about">Our story</Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Customer care</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400">
            <a
              href="mailto:hunterkali26@gmail.com"
              className="block transition hover:text-amber-700 dark:hover:text-amber-400"
            >
              hunterkali26@gmail.com
            </a>
            <a
              href="tel:+923208684757"
              className="block transition hover:text-amber-700 dark:hover:text-amber-400"
            >
              0320 8684757
            </a>
            <p>Mon - Sat, 10am - 6pm</p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <Truck className="size-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Across Pakistan</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Reliable delivery, secure checkout, and support when you need it.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        © 2026 NBS-pk. All rights reserved.
      </div>
    </footer>
  );
}