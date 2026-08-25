"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, UserRound } from "lucide-react";

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const profileActive = pathname === "/account";
  const ordersActive = pathname.startsWith("/account/orders");

  const desktopLink = (active: boolean) =>
    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${
      active
        ? "bg-emerald-700 text-white"
        : "text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800"
    }`;

  return (
    <div>
      {/* Mobile segmented toggle — a clean switch between profile and orders. */}
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 lg:hidden dark:bg-slate-800">
        <Link
          href="/account"
          aria-current={profileActive ? "page" : undefined}
          className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition ${
            profileActive
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          <UserRound className="size-4" /> Profile details
        </Link>
        <Link
          href="/account/orders"
          aria-current={ordersActive ? "page" : undefined}
          className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition ${
            ordersActive
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          <ShoppingBag className="size-4" /> Order history
        </Link>
      </div>

      {/* Desktop sidebar — vertical, with active highlighting. */}
      <aside className="hidden lg:flex lg:flex-col lg:space-y-1">
        <Link href="/account" aria-current={profileActive ? "page" : undefined} className={desktopLink(profileActive)}>
          <UserRound className="size-4 text-slate-500 dark:text-slate-400" /> Profile details
        </Link>
        <Link href="/account/orders" aria-current={ordersActive ? "page" : undefined} className={desktopLink(ordersActive)}>
          <ShoppingBag className="size-4 text-slate-500 dark:text-slate-400" /> Order history
        </Link>
        {isAdmin ? (
          <Link
            href="/admin"
            className="mt-4 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
          >
            <LayoutDashboard className="size-4" /> Admin dashboard
          </Link>
        ) : null}
      </aside>
    </div>
  );
}