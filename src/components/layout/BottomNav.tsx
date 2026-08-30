"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Info, ShoppingBag, Store, UserRound } from "lucide-react";

import { useCart } from "@/lib/cart-context";

// The bottom rail is a storefront convenience — hide it in the admin
// workspace and on the auth screens so those flows stay focused.
const HIDE_PREFIXES = ["/admin", "/login", "/signup"];

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  if (HIDE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  const items = [
    { label: "Home", href: "/", icon: Home, active: pathname === "/" },
    {
      label: "Shop",
      href: "/shop",
      icon: Store,
      active:
        pathname === "/shop" ||
        pathname.startsWith("/categories") ||
        pathname.startsWith("/products"),
    },
    { label: "Cart", href: "/cart", icon: ShoppingBag, active: pathname.startsWith("/cart"), badge: count },
    { label: "Account", href: "/account", icon: UserRound, active: pathname.startsWith("/account") },
    { label: "About", href: "/about", icon: Info, active: pathname.startsWith("/about") },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-950/95"
    >
      <div className="grid grid-cols-5">
        {items.map(({ label, href, icon: Icon, active, badge }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-wide transition ${
              active
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <span className="relative">
              <Icon className="size-5" strokeWidth={1.8} />
              {typeof badge === "number" && badge > 0 ? (
                <span className="absolute -right-2 -top-1.5 z-20 grid min-w-4 place-items-center rounded-full bg-emerald-600 px-1 text-[8px] font-bold leading-4 text-white">
                  {badge > 9 ? "9+" : badge}
                </span>
              ) : null}
            </span>
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}