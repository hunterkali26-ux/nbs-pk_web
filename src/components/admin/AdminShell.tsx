"use client";

import { PanelLeft } from "lucide-react";
import { useState, type ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/AdminSidebar";

export function AdminShell({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f1efe9]">
      <AdminSidebar isCollapsed={isCollapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center border-b border-black/10 bg-[#f1efe9]/95 px-5 backdrop-blur lg:px-8">
          <button
            type="button"
            onClick={() => setIsCollapsed((collapsed) => !collapsed)}
            aria-label={isCollapsed ? "Expand admin sidebar" : "Collapse admin sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="inline-flex size-9 items-center justify-center text-[#172a2a] transition hover:bg-black/5"
          >
            <PanelLeft className="size-5" />
          </button>
          <span className="ml-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35">Admin workspace</span>
        </header>
        <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}