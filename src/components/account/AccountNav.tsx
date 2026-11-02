"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutDashboard, ShoppingBag, UserRound } from "lucide-react";

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const profileActive = pathname === "/account";
  const ordersActive = pathname.startsWith("/account/orders");
  const wishlistActive = pathname.startsWith("/account/wishlist");

  const desktopLink = (active: boolean) =>
    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${
      active
        ? "bg-amber-700 text-white"
        : "text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800"
    }`;

  return (
    <div>
            {/* Mobile segmented toggle — profile / wishlist / orders. */}
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 lg:hidden dark:bg-slate-800">
        <Link
          href="/account"
          aria-current={profileActive ? "page" : undefined}
          className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition ${
            profileActive
              ? "bg-amber-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          <UserRound className="size-4" /> Profile
        </Link>
        <Link
          href="/account/wishlist"
          aria-current={wishlistActive ? "page" : undefined}
          className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
            wishlistActive
              ? "bg-amber-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          <Heart className="size-4" /> Wishlist
        </Link>
        <Link
          href="/account/orders"
          aria-current={ordersActive ? "page" : undefined}
          className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition ${
            ordersActive
              ? "bg-amber-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          <ShoppingBag className="size-4" /> Orders
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
        <Link href="/account/wishlist" aria-current={wishlistActive ? "page" : undefined} className={desktopLink(wishlistActive)}>
          <Heart className="size-4 text-slate-500 dark:text-slate-400" /> My wishlist
        </Link>
        {isAdmin ? (
          <Link
            href="/admin"
            className="mt-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/40"
          >
            <LayoutDashboard className="size-4" /> Admin dashboard
          </Link>
        ) : null}
      </aside>
    </div>
  );
}