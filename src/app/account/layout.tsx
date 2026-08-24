import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, ShoppingBag, UserRound } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Surface the Admin Dashboard shortcut only for admins.
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = (profileRow as { role: string } | null)?.role === "admin";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0 lg:space-y-1">
            <Link
              href="/account"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <UserRound className="size-4 text-slate-500 dark:text-slate-400" />
              Profile details
            </Link>
            <Link
              href="/account/orders"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ShoppingBag className="size-4 text-slate-500 dark:text-slate-400" />
              Order history
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                className="mt-4 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
              >
                <LayoutDashboard className="size-4" />
                Admin dashboard
              </Link>
            ) : null}
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
