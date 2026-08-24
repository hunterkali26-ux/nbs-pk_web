"use client";

import { Menu, PanelLeft } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { DarkModeToggle } from "@/components/layout/ThemeProvider";

export function AdminShell({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll while the mobile drawer is open so the page behind it
  // can't be scrolled mid-gesture.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminSidebar
        isCollapsed={isCollapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-1 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-5 lg:px-8 dark:border-slate-800 dark:bg-slate-900/95">
          {/* Desktop collapse toggle (hidden on mobile — the drawer has its own). */}
          <button
            type="button"
            onClick={() => setIsCollapsed((collapsed) => !collapsed)}
            aria-label={isCollapsed ? "Expand admin sidebar" : "Collapse admin sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden size-9 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 lg:inline-flex dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <PanelLeft className="size-5" />
          </button>
          {/* Mobile hamburger — opens the slide-over drawer below lg. */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open admin menu"
            aria-controls="admin-mobile-menu"
            aria-expanded={mobileOpen}
            className="inline-flex size-10 items-center justify-center rounded-lg text-slate-700 active:bg-slate-100 lg:hidden dark:text-slate-200 dark:active:bg-slate-800"
          >
            <Menu className="size-5" />
          </button>
          <DarkModeToggle />
          <span className="ml-1 hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35 sm:inline dark:text-slate-400">Admin workspace</span>
        </header>
        {/* No inner scroll context — the page itself scrolls while the sticky
            sidebar (h-screen top-0) and this header stay locked in place. */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}