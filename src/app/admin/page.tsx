import { BarChart3, Boxes, ShoppingCart, Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import type { Order, Product, Profile } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const supabase = await createClient();
  const [{ data: ordersData }, { data: productsData }, { data: profilesData }] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("products").select("*"),
    supabase.from("profiles").select("id")
  ]);
  const orders = (ordersData ?? []) as Order[];
  const products = (productsData ?? []) as Product[];
  const profiles = (profilesData ?? []) as Pick<Profile, "id">[];
  const sales = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const stats = [["Total sales", `PKR ${sales.toLocaleString("en-PK")}`, BarChart3], ["Total orders", String(orders.length), ShoppingCart], ["Active products", String(products.length), Boxes], ["Registered customers", String(profiles.length), Users]] as const;
  return <main className="min-h-screen bg-[#f1efe9] px-6 py-10 lg:px-10 lg:py-14"><div className="mx-auto max-w-[1250px]"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b58a3a]">Command centre</p><h1 className="mt-3 font-serif text-5xl">Overview</h1><p className="mt-4 max-w-lg text-sm leading-6 text-black/50">A clear view of the VEXIS pk storefront, from the day&apos;s orders to the pieces in rotation.</p><div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, Icon]) => <div key={label} className="border border-black/10 bg-white p-6"><Icon className="size-5 text-[#b58a3a]" /><p className="mt-8 text-[10px] font-semibold uppercase tracking-widest text-black/40">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p></div>)}</div><section className="mt-10 border border-black/10 bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold uppercase tracking-widest">Latest orders</h2><span className="text-xs text-black/40">{orders.length} total</span></div>{orders.slice(0, 5).map((order) => <div key={order.id} className="flex items-center justify-between border-b border-black/8 py-4 last:border-0"><div><p className="font-mono text-xs">#{order.id.slice(0, 8)}</p><p className="mt-1 text-xs capitalize text-black/45">{order.status}</p></div><p className="text-sm font-semibold">PKR {Number(order.total_amount).toLocaleString("en-PK")}</p></div>)}{orders.length === 0 ? <p className="py-10 text-center text-sm text-black/45">Your first order will appear here.</p> : null}</section></div></main>;
}
