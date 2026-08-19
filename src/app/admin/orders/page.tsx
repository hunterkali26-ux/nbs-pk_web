import { OrderStatus } from "@/components/admin/OrderStatus";
import { createClient } from "@/lib/supabase/server";
import type { Order, Profile } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createClient();
  const [{ data: orderData }, { data: profileData }] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*")
  ]);
  const { data: itemData } = await supabase.from("order_items").select("order_id, quantity");
  const orders = (orderData ?? []) as Order[];
  const profiles = (profileData ?? []) as Profile[];
  const items = (itemData ?? []) as { order_id: string; quantity: number }[];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const itemCounts = new Map<string, number>();
  items.forEach((item) => itemCounts.set(item.order_id, (itemCounts.get(item.order_id) ?? 0) + item.quantity));
  return <main className="min-h-screen bg-[#f1efe9] px-6 py-10 lg:px-10 lg:py-14"><div className="mx-auto max-w-[1400px]"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b58a3a]">Commerce</p><h1 className="mt-3 font-serif text-5xl">Orders</h1><div className="mt-10 overflow-x-auto border border-black/10 bg-white"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="border-b border-black/10 text-[10px] uppercase tracking-widest text-black/40"><tr><th className="px-5 py-4">Order ID</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Contact / address</th><th className="px-5 py-4">Items</th><th className="px-5 py-4">Total</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Status</th></tr></thead><tbody>{orders.map((order) => { const customer = profileMap.get(order.user_id); return <tr key={order.id} className="border-b border-black/8 last:border-0"><td className="px-5 py-4 font-mono text-xs">{order.id.slice(0, 8)}...</td><td className="px-5 py-4 font-semibold">{customer?.full_name || "Guest"}</td><td className="max-w-xs px-5 py-4 text-xs text-black/55">{customer?.phone_number || "—"}<br />{typeof order.shipping_address === "object" ? JSON.stringify(order.shipping_address) : order.shipping_address}</td><td className="px-5 py-4 text-black/55">{itemCounts.get(order.id) ?? 0} item(s)</td><td className="px-5 py-4 font-semibold">PKR {order.total_amount.toLocaleString("en-PK")}</td><td className="px-5 py-4 text-xs text-black/50">{new Date(order.created_at).toLocaleDateString("en-PK")}</td><td className="px-5 py-4"><OrderStatus orderId={order.id} value={order.status} /></td></tr>; })}</tbody></table>{orders.length === 0 ? <p className="p-12 text-center text-sm text-black/45">No orders have arrived yet.</p> : null}</div></div></main>;
}
