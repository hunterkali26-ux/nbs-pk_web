"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ChevronDown,
  Heart,
  Home,
  Info,
  LayoutDashboard,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  Package,
  Search,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserRound,
  X,
} from "lucide-react";

import { signOut } from "@/app/auth/actions";
import { SearchBar } from "@/components/layout/SearchBar";
import { DarkModeToggle } from "@/components/layout/ThemeProvider";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

const links = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["About", "/about"],
  ["Categories", "/categories"],
] as const;

/** Drawer navigation — mirrors the desktop links, with Categories pointing at
    the dedicated /categories page (the home anchor section is desktop-only). */
const mobileNavItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Shop", href: "/shop", icon: Store },
  { label: "Categories", href: "/categories", icon: LayoutGrid },
  { label: "About", href: "/about", icon: Info },
] as const;

/** Shared styling for drawer rows — subtle active/hover states. */
const drawerLinkClass = (active: boolean) =>
  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
    active
      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
  }`;

const drawerEyebrowClass =
  "px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500";

type NavSession = {
  fullName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
};

const dropdownItemClass =
  "flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-amber-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-amber-400";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [session, setSession] = useState<NavSession | null>(null);
  // Held "true" only AFTER hydration when an auth cookie exists, so the header
  // never flashes a misleading signed-out state while the session resolves.
  // Initial value is always false (matches SSR) — no hydration mismatch.
  const [sessionLoading, setSessionLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { count } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  // Prefetch a route on hover so the next page is already warming up in the
  // background — the click navigation is then effectively instant.
  const prefetchRoute = useCallback(
    (href: string) => void router.prefetch(href),
    [router],
  );

  // Active-link detection for the drawer (exact match for "/", prefix else).
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Lock body scroll and support Escape-to-close while the drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    // Post-hydration only: if Supabase auth cookies exist on this device we are
    // very likely signed in — hold "loading" so the header doesn't flash the
    // sign-in button while the session resolves from storage. Deferred to a
    // macrotask so the effect never triggers a cascading synchronous render.
    let loadingTimer: ReturnType<typeof setTimeout> | undefined;
    if (typeof document !== "undefined") {
      const hasAuthCookie = document.cookie
        .split(";")
        .some((part) => part.trim().startsWith("sb-"));
      if (hasAuthCookie) loadingTimer = setTimeout(() => setSessionLoading(true), 0);
    }

    const normalizeRole = (value: unknown): string =>
      typeof value === "string" ? value.trim().toLowerCase() : "";

    /** Render the header immediately from a user object (no async wait). */
    const applyUser = (user: User) => {
      const metadata = user.user_metadata as Record<string, unknown> | undefined;
      const metaFullName =
        typeof metadata?.full_name === "string" ? metadata.full_name : "";

      setSession({
        fullName: metaFullName || user.email || "My account",
        avatarUrl: null,
        isAdmin: normalizeRole(metadata?.role) === "admin",
      });
      setSessionLoading(false);

      // Refine the display name + admin flag from the profiles table once it
      // arrives; never let a missing/RLS-denied row flip us back to signed-out.
      void supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (cancelled || !data) return;
          if (error) {
            console.warn("Navbar profile lookup failed:", error.message);
            return;
          }
          const profile = data as Pick<Profile, "full_name" | "role"> | null;
          if (!profile) return;
          setSession((previous) =>
            previous
              ? {
                  ...previous,
                  fullName: profile.full_name || previous.fullName,
                  isAdmin: previous.isAdmin || normalizeRole(profile.role) === "admin",
                }
              : previous,
          );
        });
    };

    const loadSession = async () => {
      // 1) Instant restore from the cached session — no network round-trip,
      //    so reloads/navigation never show a stale signed-out header.
      const {
        data: { session: cachedSession },
      } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!cachedSession?.user) {
        setSession(null);
        setSessionLoading(false);
        return;
      }
      applyUser(cachedSession.user);

      // 2) Background validation + access-token refresh, which also keeps the
      //    SSR auth cookies in sync via @supabase/ssr's cookie manager.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (user) applyUser(user);
      else {
        setSession(null);
        setSessionLoading(false);
      }
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, authSession) => {
      // Respond to auth transitions instantly instead of re-running a full
      // load — prevents flicker and keeps state across route changes.
      if (event === "SIGNED_OUT") {
        setSession(null);
        setSessionLoading(false);
        return;
      }
      if (authSession?.user) {
        applyUser(authSession.user);
        return;
      }
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void loadSession();
      }
    });

    return () => {
      cancelled = true;
      if (loadingTimer) clearTimeout(loadingTimer);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const initials = session
    ? session.fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join("")
    : "";

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:gap-4 sm:px-6 lg:px-8">
        <button
          className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
        <Link href="/" aria-label="NBS-pk — home" className="shrink-0 -ml-2">
          <div className="inline-block bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-xl p-1.5 transition-colors">
            <Image
              src="https://4upsg7iazjf61bbi.public.blob.vercel-storage.com/assets/brand-logo.png"
              alt="NBS-pk"
              width={732}
              height={218}
              priority
              className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto max-w-[180px] sm:max-w-none object-contain"
            />
          </div>
        </Link>
        <div className="hidden items-center gap-5 lg:flex">
          {links.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              prefetch={true}
              onMouseEnter={() => prefetchRoute(href)}
              className="text-sm font-medium text-slate-600 transition hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-400"
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="ml-auto hidden max-w-xl flex-1 sm:block">
          <SearchBar />
        </div>
        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          {/* Mobile-only search toggle (the desktop form appears from sm+). */}
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            aria-label={searchOpen ? "Close search" : "Search products"}
            aria-expanded={searchOpen}
            className="sm:hidden inline-flex size-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Search className="size-5" />
          </button>
          <DarkModeToggle />
          <Link
            href="/cart"
            aria-label={`Shopping bag, ${count} item${count === 1 ? "" : "s"}`}
            className="relative z-10 overflow-visible rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 z-20 grid size-4 place-items-center rounded-full bg-amber-600 text-[9px] font-bold text-white">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>

          {sessionLoading ? (
            // Stable, size-matched placeholder while auth resolves — prevents
            // a misleading signed-out flash on reload / route change.
            <span aria-hidden="true" className="hidden size-9 md:block" />
          ) : !session ? (
            <Link
              href="/login"
              aria-label="Sign in"
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-amber-600 hover:text-amber-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-amber-500 dark:hover:text-amber-400"
            >
              <UserRound className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          ) : (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="hidden items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 transition hover:border-amber-600 md:flex dark:border-slate-700 dark:hover:border-amber-500"
              >
                {session.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.avatarUrl}
                    alt=""
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid size-7 place-items-center rounded-full bg-amber-700 text-[11px] font-bold text-white">
                    {initials}
                  </span>
                )}
                <span className="hidden max-w-28 truncate text-sm font-semibold text-slate-700 md:block dark:text-slate-200">
                  {session.fullName}
                </span>
                {session.isAdmin && (
                  <Shield
                    className="size-3.5 shrink-0 text-[#d4b06a]"
                    aria-label="Administrator"
                  />
                )}
                <ChevronDown
                  className={`size-4 text-slate-400 transition-transform dark:text-slate-500 ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="border-b border-slate-100 px-4 pb-3 pt-1 dark:border-slate-800">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{session.fullName}</p>
                    <p className="mt-0.5 text-xs uppercase tracking-widest text-slate-400">
                      {session.isAdmin ? "Administrator" : "NBS-pk member"}
                    </p>
                  </div>
                  <div className="py-1.5">
                    <Link
                      href="/account"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className={dropdownItemClass}
                    >
                      <UserRound className="size-4" />
                      My account
                    </Link>
                    <Link
                      href="/account/orders"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className={dropdownItemClass}
                    >
                      <Package className="size-4" />
                      My orders
                    </Link>
                    {session.isAdmin && (
                      <Link
                        href="/admin"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="mt-1 flex items-center gap-3 border-t border-slate-100 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 hover:text-amber-800 dark:border-slate-800 dark:text-amber-400 dark:hover:bg-amber-950/60 dark:hover:text-amber-300"
                      >
                        <LayoutDashboard className="size-4" />
                        Admin dashboard
                        <ShieldCheck className="ml-auto size-4 text-[#d4b06a]" />
                      </Link>
                    )}
                  </div>
                  <form action={signOut} className="border-t border-slate-100 pt-1 dark:border-slate-800">
                    <button
                      type="submit"
                      role="menuitem"
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expandable mobile search — live suggestions dropdown included */}
      {searchOpen ? (
        <div className="mx-4 pb-3 lg:hidden">
          <SearchBar variant="mobile" onClose={() => setSearchOpen(false)} />
        </div>
      ) : null}

    </header>

    {/* Mobile slide-over navigation (below lg — mirrors the hamburger
        trigger's breakpoint). Deliberately rendered OUTSIDE <header>: the
        header's backdrop-blur would otherwise become the containing block for
        position:fixed children, confining the drawer to the header strip.
        z-[100] keeps it above every page layer — sticky header (z-40),
        bottom nav (z-40) and product lightbox (z-80) included. */}
      <div
        aria-hidden={!mobileOpen}
        className={`fixed inset-0 z-[100] lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
      >
        {/* Backdrop — semi-transparent with blur, click to dismiss */}
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Drawer panel — ~78% width, slides in from the left */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`absolute inset-y-0 left-0 flex w-[78%] max-w-xs flex-col overflow-hidden rounded-r-2xl bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-slate-950 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Brand header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              aria-label="NBS-pk — home"
              className="flex shrink-0 px-1"
            >
              <div className="inline-block bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-white/50 dark:border-slate-800/50 shadow-gray-200/50 dark:shadow-none transition-colors">
                <Image
                  src="https://4upsg7iazjf61bbi.public.blob.vercel-storage.com/assets/brand-logo.png"
                  alt="NBS-pk"
                  width={446}
                  height={131}
                  className="h-12 w-auto object-contain"
                />
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Scrollable middle — primary links + account section */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <p className={drawerEyebrowClass}>Menu</p>
            <ul className="space-y-1">
              {mobileNavItems.map(({ label, href, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    prefetch={true}
                    onMouseEnter={() => prefetchRoute(href)}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive(href) ? "page" : undefined}
                    className={drawerLinkClass(isActive(href))}
                  >
                    <Icon className="size-[18px]" strokeWidth={1.8} />
                    <span>{label}</span>
                    {isActive(href) ? (
                      <span className="ml-auto size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>

            <p className={`${drawerEyebrowClass} pt-6`}>Account</p>
            <ul className="space-y-1">
              {session ? (
                <>
                  <li>
                    <Link
                      href="/account"
                      onClick={() => setMobileOpen(false)}
                      aria-current={isActive("/account") && !isActive("/account/orders") ? "page" : undefined}
                      className={drawerLinkClass(isActive("/account") && !isActive("/account/orders"))}
                    >
                      <UserRound className="size-[18px]" strokeWidth={1.8} />
                      My account
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/account/orders"
                      onClick={() => setMobileOpen(false)}
                      aria-current={isActive("/account/orders") ? "page" : undefined}
                      className={drawerLinkClass(isActive("/account/orders"))}
                    >
                      <Package className="size-[18px]" strokeWidth={1.8} />
                      My orders
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/account/wishlist"
                      onClick={() => setMobileOpen(false)}
                      aria-current={isActive("/account/wishlist") ? "page" : undefined}
                      className={drawerLinkClass(isActive("/account/wishlist"))}
                    >
                      <Heart className="size-[18px]" strokeWidth={1.8} />
                      My wishlist
                    </Link>
                  </li>
                  {session.isAdmin ? (
                    <li>
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className={drawerLinkClass(isActive("/admin"))}
                      >
                        <LayoutDashboard className="size-[18px]" strokeWidth={1.8} />
                        Admin dashboard
                        <ShieldCheck className="ml-auto size-4 shrink-0 text-[#d4b06a]" />
                      </Link>
                    </li>
                  ) : null}
                  <li>
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <LogOut className="size-[18px]" strokeWidth={1.8} />
                        Sign out
                      </button>
                    </form>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      aria-current={isActive("/login") ? "page" : undefined}
                      className={drawerLinkClass(isActive("/login"))}
                    >
                      <LogIn className="size-[18px]" strokeWidth={1.8} />
                      Sign in
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/signup"
                      onClick={() => setMobileOpen(false)}
                      className={drawerLinkClass(false)}
                    >
                      <UserRound className="size-[18px]" strokeWidth={1.8} />
                      Create account
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>

          {/* Leftover space stays clean — just a subtle branding strip */}
          <div className="mt-auto shrink-0 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
            <p className="text-[11px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
              © 2026 NBS-pk
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
