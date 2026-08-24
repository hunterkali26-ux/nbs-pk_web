"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  Shield,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";

import { signOut } from "@/app/auth/actions";
import { DarkModeToggle } from "@/components/layout/ThemeProvider";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

const links = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["About", "/about"],
  ["Categories", "/#categories"],
] as const;

type NavSession = {
  fullName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
};

const dropdownItemClass =
  "flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-emerald-400";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<NavSession | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { count } = useCart();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const loadSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!user) {
        setSession(null);
        return;
      }

      const metadata = user.user_metadata as Record<string, unknown> | undefined;

      // Prefer the profiles table, but never let a missing/hidden row
      // (RLS-denied SELECT, not-yet-created profile, etc.) misclassify the
      // user. Capture the query error so it's debuggable, then fall back to
      // the role attached to auth metadata at signup time.
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.warn("Navbar profile lookup failed (falling back to metadata):", profileError.message);
      }

      const profile = profileRows as Pick<Profile, "full_name" | "role"> | null;

      const normalizeRole = (value: unknown): string =>
        typeof value === "string" ? value.trim().toLowerCase() : "";

      // Case-insensitive admin check across BOTH sources.
      const isAdmin =
        normalizeRole(profile?.role) === "admin" ||
        normalizeRole(metadata?.role) === "admin";

      const metaFullName =
        typeof metadata?.full_name === "string" ? metadata.full_name : "";

      setSession({
        // Prefer the profiles-table name, then signup metadata — the email
        // address is only ever a last-resort label.
        fullName:
          profile?.full_name || metaFullName || user.email || "My account",
        // No avatar_url column exists on the profiles table — the navbar
        // always renders initials (via session.fullName) for the avatar.
        avatarUrl: null,
        isAdmin,
      });
    };

    void loadSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadSession();
    });

    return () => {
      cancelled = true;
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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button
          className="p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
        <Link href="/" className="shrink-0 text-xl font-black tracking-tight text-slate-900 dark:text-white">
          VEXIS <span className="text-emerald-600">pk</span>
        </Link>
        <div className="hidden items-center gap-5 lg:flex">
          {links.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="text-sm font-medium text-slate-600 transition hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
            >
              {label}
            </Link>
          ))}
        </div>
        <form className="ml-auto hidden max-w-xl flex-1 items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 sm:flex dark:border-slate-700 dark:bg-slate-900">
          <Search className="ml-3 size-4 text-slate-400" />
          <input
            aria-label="Search products"
            placeholder="Search watches, perfumes, shoes..."
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          <button className="bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
            Search
          </button>
        </form>
        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <DarkModeToggle />
          <Link
            href="/cart"
            aria-label={`Shopping bag, ${count} item${count === 1 ? "" : "s"}`}
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-emerald-600 text-[9px] font-bold text-white">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>

          {!session ? (
            <Link
              href="/login"
              className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 sm:flex dark:border-slate-700 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
            >
              <UserRound className="size-4" />
              Sign in
            </Link>
          ) : (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 transition hover:border-emerald-600 dark:border-slate-700 dark:hover:border-emerald-500"
              >
                {session.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.avatarUrl}
                    alt=""
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid size-7 place-items-center rounded-full bg-emerald-700 text-[11px] font-bold text-white">
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
                      {session.isAdmin ? "Administrator" : "VEXIS pk member"}
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
                        className="mt-1 flex items-center gap-3 border-t border-slate-100 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-800 dark:text-emerald-400 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300"
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

      {mobileOpen && (
        <nav className="border-t border-slate-200 bg-white px-5 py-3 lg:hidden dark:border-slate-800 dark:bg-slate-950">
          {links.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="block border-b border-slate-100 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200"
            >
              {label}
            </Link>
          ))}
          {session ? (
            <>
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="block border-b border-slate-100 py-3 text-sm font-semibold text-emerald-700"
              >
                My account
              </Link>
              <Link
                href="/account/orders"
                onClick={() => setMobileOpen(false)}
                className="block border-b border-slate-100 py-3 text-sm font-semibold text-emerald-700"
              >
                My orders
              </Link>
              {session.isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="block border-b border-slate-100 py-3 text-sm font-semibold text-emerald-700 dark:border-slate-800"
                >
                  <Shield className="mr-2 inline size-3.5" />
                  Admin dashboard
                </Link>
              )}
              <form action={signOut}>
                <button type="submit" className="py-3 text-sm font-semibold text-red-600">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-sm font-semibold text-emerald-700"
            >
              Sign in
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
