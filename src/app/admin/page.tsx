import { BarChart3, Boxes, ShoppingCart, Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const supabase = await createClient();

  // Aggregate counts (head + exact count) instead of shipping entire tables to
  // the client just to count them. Sales sums just the lightweight total_amount
  // column (single numeric field, not full rows); the only full row-set fetched
  // is the 5 latest orders, and even that selects a tiny column subset.
  const [{ count: orderCount }, { count: productCount }, { count: profileCount }, { data: salesData }, { data: recentOrders }] =
    await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("total_amount"),
      supabase
        .from("orders")
        .select("id, status, total_amount, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const orders = (recentOrders ?? []) as {
    id: string;
    status: string | null;
    total_amount: number | null;
    created_at: string;
  }[];
  const sales = ((salesData ?? []) as { total_amount: number | null }[]).reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0,
  );

  const stats = [
    ["Total sales", `PKR ${sales.toLocaleString("en-PK")}`, BarChart3],
    ["Total orders", String(orderCount ?? 0), ShoppingCart],
    ["Active products", String(productCount ?? 0), Boxes],
    ["Registered customers", String(profileCount ?? 0), Users],
  ] as const;

  return (
    <main className="min-h-screen bg-[#f1efe9] px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-14 dark:bg-slate-950">
      <div className="mx-auto max-w-[1250px]">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d4b06a]">Command centre</p>
        <h1 className="mt-3 font-serif font-black text-4xl sm:text-5xl">Overview</h1>
        <p className="mt-4 max-w-lg text-sm leading-6 text-black/50 dark:text-slate-400">
          A clear view of the VEXIS pk storefront, from the day&apos;s orders to the pieces in rotation.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value, Icon]) => (
            <div key={label} className="border border-black/10 bg-white p-5 sm:p-6 dark:border-white/10 dark:bg-slate-900">
              <Icon className="size-5 text-[#d4b06a]" />
              <p className="mt-8 text-[10px] font-semibold uppercase tracking-widest text-black/40 dark:text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
            </div>
          ))}
        </div>
        <section className="mt-10 border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest">Latest orders</h2>
            <span className="text-xs text-black/40 dark:text-slate-500">{orderCount ?? 0} total</span>
          </div>
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between border-b border-black/8 py-4 last:border-0 dark:border-white/10">
              <div>
                <p className="font-mono text-xs">#{order.id.slice(0, 8)}</p>
                <p className="mt-1 text-xs capitalize text-black/45 dark:text-slate-400">{order.status}</p>
              </div>
              <p className="text-sm font-semibold">PKR {Number(order.total_amount).toLocaleString("en-PK")}</p>
            </div>
          ))}
          {orders.length === 0 ? (
            <p className="py-10 text-center text-sm text-black/45 dark:text-slate-400">Your first order will appear here.</p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
