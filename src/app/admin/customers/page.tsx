import { AdminCustomersView, type AdminCustomer } from "@/components/admin/AdminCustomersView";
import { createClient } from "@/lib/supabase/server";
import type { Order, Profile } from "@/types/database";

export const dynamic = "force-dynamic";

/** Bounded customer rows so the directory stays responsive at scale. */
const CUSTOMER_PAGE_SIZE = 500;

export default async function CustomersPage() {
  const supabase = await createClient();

  // Fetch profiles (bounded) plus every order's id/user_id in parallel. The
  // order feed is what already joins per-user stats; a count/id projection keeps
  // it lightweight.
  const [{ data: profileRows }, { data: orderRows }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(CUSTOMER_PAGE_SIZE),
    supabase
      .from("orders")
      .select("id, user_id, total_amount, status, city, created_at")
      .order("created_at", { ascending: false }),
  ]);

  // The profiles table has no email column — the row may carry one only if a
  // future migrations adds it. Existing rows fall back to "Not on file".
  const profiles = (profileRows ?? []) as (Profile & { email?: string | null })[];
  const orders = (orderRows ?? []) as Pick<Order, "id" | "user_id" | "total_amount" | "status" | "city" | "created_at">[];

  const ordersByUser = new Map<string, AdminCustomer["orders"]>();
  for (const order of orders) {
    const list = ordersByUser.get(order.user_id) ?? [];
    list.push({
      id: order.id,
      created_at: order.created_at,
      total_amount: Number(order.total_amount || 0),
      status: String(order.status ?? "pending"),
      city: order.city ?? "",
    });
    ordersByUser.set(order.user_id, list);
  }

  const customers: AdminCustomer[] = profiles.map((profile) => {
    const userOrders = ordersByUser.get(profile.id) ?? [];
    return {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email ?? null,
      phone_number: profile.phone_number,
      address: profile.address,
      role: profile.role,
      created_at: profile.created_at,
      orderCount: userOrders.length,
      totalSpend: userOrders.reduce((sum, order) => sum + order.total_amount, 0),
      orders: userOrders,
    };
  });

  return (
    <main className="min-h-screen bg-[#f1efe9] px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-14 dark:bg-slate-950">
      <div className="mx-auto max-w-[1250px]">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d4b06a]">People</p>
        <h1 className="mt-3 font-serif font-black text-4xl sm:text-5xl">Customers</h1>
        <p className="mt-2 text-sm text-black/50 dark:text-slate-400">
          Click any row for a full profile with live order history and spend stats.
        </p>
        <div className="mt-8">
          <AdminCustomersView customers={customers} />
        </div>
      </div>
    </main>
  );
}
