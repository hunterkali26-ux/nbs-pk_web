"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronRight,
  Home,
  LogOut,
  ShoppingCart,
  Tags,
  Users,
  X,
} from "lucide-react";

import { signOut } from "@/app/auth/actions";

const links = [
  ["Overview", "/admin", BarChart3],
  ["Products", "/admin/products", Boxes],
  ["Categories", "/admin/categories", Tags],
  ["Orders", "/admin/orders", ShoppingCart],
  ["Customers", "/admin/customers", Users],
] as const;

/** Shared nav content used by the desktop rail and the mobile drawer. */
function SidebarNav({
  pathname,
  isCollapsed,
  onClose,
}: {
  pathname: string;
  isCollapsed: boolean;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Fixed header height matches the main workspace header (h-16) so the
          two bottom borders sit perfectly flush and parallel. */}
      <div className={`flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-4 ${isCollapsed ? "justify-center" : "justify-between"}`}>
        <Link
          href="/admin"
          onClick={onClose}
          aria-label="NBS-pk admin dashboard"
          className={`flex items-center ${isCollapsed ? "justify-center" : ""}`}
        >
          {isCollapsed ? (
            /* Collapsed rail: the square admin icon centers in the narrow
               20px rail, rendered cleanly in both light and dark themes
               (transparent background) so it reads at a glance. */
            <Image
              src="https://4upsg7iazjf61bbi.public.blob.vercel-storage.com/assets/Untitled%20design%282%29.png"
              alt="NBS-pk"
              width={32}
              height={32}
              className="size-8 object-contain"
            />
          ) : (
            <Image
              src="https://4upsg7iazjf61bbi.public.blob.vercel-storage.com/assets/Polished_Gold_NBS_Logo_on_Black-removebg-preview.png"
              alt="NBS-pk"
              width={732}
              height={218}
              className="h-10 w-auto object-contain"
            />
          )}
        </Link>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin menu"
            className="inline-flex size-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        ) : !isCollapsed ? (
          <span className="text-[9px] uppercase tracking-[0.2em] text-white/35">Control</span>
        ) : null}
      </div>

      <nav className={`flex flex-1 flex-col gap-1 overflow-y-auto p-3 ${isCollapsed ? "items-center" : ""}`}>
        {links.map(([label, href, Icon]) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              title={isCollapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-3 text-xs font-semibold uppercase tracking-[0.13em] transition ${
                isCollapsed ? "w-11 justify-center" : "w-full"
              } ${active ? "bg-amber-600 text-white" : "text-white/50 hover:bg-white/8 hover:text-white"}`}
            >
              <Icon className="size-4 shrink-0" />
              {!isCollapsed ? (
                <>
                  <span>{label}</span>
                  {active ? <ChevronRight className="ml-auto size-3" /> : null}
                </>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <Link
          href="/"
          onClick={onClose}
          title={isCollapsed ? "Back to home" : undefined}
          aria-label="Back to home"
          className={`flex items-center gap-3 px-3 py-3 text-xs font-semibold uppercase tracking-[0.13em] text-white/45 transition hover:text-white ${
            isCollapsed ? "w-11 justify-center" : ""
          }`}
        >
          <Home className="size-4 shrink-0" />
          {!isCollapsed ? "Back to home" : null}
        </Link>
      </div>

      <form action={signOut} className="shrink-0 border-t border-white/10 p-3">
        <button
          title={isCollapsed ? "Sign out" : undefined}
          className={`flex items-center gap-3 px-3 py-3 text-xs font-semibold uppercase tracking-[0.13em] text-white/45 transition hover:text-white ${
            isCollapsed ? "w-11 justify-center" : "w-full"
          }`}
        >
          <LogOut className="size-4 shrink-0" />
          {!isCollapsed ? "Sign out" : null}
        </button>
      </form>
    </>
  );
}

export function AdminSidebar({
  isCollapsed,
  mobileOpen,
  onClose,
}: {
  isCollapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop persistent rail — hidden below lg (mobile uses the drawer).
          Sticky + h-screen keep the header and footer pinned to the viewport
          while the middle nav scrolls on its own. */}
      <aside
        className={`hidden shrink-0 flex-col bg-slate-900 text-white transition-[width] duration-300 ease-in-out lg:sticky lg:top-0 lg:flex lg:h-screen ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <SidebarNav pathname={pathname} isCollapsed={isCollapsed} />
      </aside>

      {/* Mobile slide-over drawer with backdrop click-to-close. */}
      <div
        id="admin-mobile-menu"
        aria-hidden={!mobileOpen}
        className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
      >
        <div
          onClick={onClose}
          aria-hidden="true"
          className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-64 max-w-[85%] flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-300 ease-in-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarNav pathname={pathname} isCollapsed={false} onClose={onClose} />
        </aside>
      </div>
    </>
  );
}