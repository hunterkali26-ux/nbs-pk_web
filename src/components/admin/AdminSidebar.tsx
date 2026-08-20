"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, ChevronRight, LogOut, ShoppingCart, Tags, Users } from "lucide-react";

import { signOut } from "@/app/auth/actions";

const links = [
  ["Overview", "/admin", BarChart3],
  ["Products", "/admin/products", Boxes],
  ["Categories", "/admin/categories", Tags],
  ["Orders", "/admin/orders", ShoppingCart],
  ["Customers", "/admin/customers", Users],
] as const;

export function AdminSidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();
  return (
    <aside className={`flex min-h-screen shrink-0 flex-col bg-slate-900 text-white transition-[width] duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-64"}`}>
      <div className={`flex items-center border-b border-white/10 px-4 py-6 ${isCollapsed ? "justify-center" : "justify-between"}`}>
        <Link href="/admin" className="whitespace-nowrap text-lg font-semibold tracking-[0.25em]">{isCollapsed ? "V" : <>VEXIS <span className="text-[#d4b06a]">pk</span></>}</Link>
        {!isCollapsed ? <span className="text-[9px] uppercase tracking-[0.2em] text-white/35">Control</span> : null}
      </div>
      <nav className={`flex flex-1 flex-col gap-1 p-3 ${isCollapsed ? "items-center" : ""}`}>
        {links.map(([label, href, Icon]) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return <Link key={href} href={href} title={isCollapsed ? label : undefined} className={`flex items-center gap-3 px-3 py-3 text-xs font-semibold uppercase tracking-[0.13em] transition ${isCollapsed ? "w-11 justify-center" : "w-full"} ${active ? "bg-emerald-600 text-white" : "text-white/50 hover:bg-white/8 hover:text-white"}`}><Icon className="size-4 shrink-0" />{!isCollapsed ? <><span>{label}</span>{active ? <ChevronRight className="ml-auto size-3" /> : null}</> : null}</Link>;
        })}
      </nav>
      <form action={signOut} className="border-t border-white/10 p-3"><button title={isCollapsed ? "Sign out" : undefined} className={`flex items-center gap-3 px-3 py-3 text-xs font-semibold uppercase tracking-[0.13em] text-white/45 hover:text-white ${isCollapsed ? "w-11 justify-center" : "w-full"}`}><LogOut className="size-4 shrink-0" />{!isCollapsed ? "Sign out" : null}</button></form>
    </aside>
  );
}