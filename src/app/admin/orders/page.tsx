import { AdminOrdersView, type AdminOrderItem, type AdminOrderRow } from "@/components/admin/AdminOrdersView";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/types/database";

export const dynamic = "force-dynamic";

/** Cap the rows shipped to the admin orders table (newest-first) so payloads and
 *  client hydration stay bounded regardless of how many orders exist. */
const ORDER_PAGE_SIZE = 200;

export default async function OrdersPage() {
  const supabase = await createClient();

  // Fetch only the newest bounded page of orders (indexed by created_at) instead
  // of the entire table. Then pull the lines + referenced products in indexed
  // IN-clauses scoped to exactly those orders.
  const { data: orderData } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(ORDER_PAGE_SIZE);

  const orders = (orderData ?? []) as Order[];
  const orderIds = orders.map((order) => order.id);

  const itemRows = orderIds.length > 0
    ? await supabase
        .from("order_items")
        .select("order_id, product_id, quantity, price_at_purchase")
        .in("order_id", orderIds)
    : { data: null };

  const items = (itemRows.data ?? []) as unknown as {
    order_id: string;
    product_id: string | null;
    quantity: number;
    price_at_purchase: number | null;
  }[];

  // Resolve every referenced product in one indexed IN query (bounded set).
  const productIds = [
    ...new Set(items.map((item) => item.product_id).filter((id): id is string => Boolean(id))),
  ];
  const productMap = new Map<string, { title: string; image_url: string | null; category: string | null }>();
  if (productIds.length > 0) {
    const { data: productRows } = await supabase
      .from("products")
      .select("id, title, image_url, category")
      .in("id", productIds);
    for (const product of (productRows ?? []) as {
      id: string;
      title: string;
      image_url: string | null;
      category: string | null;
    }[]) {
      productMap.set(product.id, {
        title: product.title,
        image_url: product.image_url,
        category: product.category,
      });
    }
  }

  // Group lines per order so each row carries its full item list.
  const itemsByOrder = new Map<string, AdminOrderItem[]>();
  for (const item of items) {
    const product = item.product_id ? productMap.get(item.product_id) : undefined;
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push({
      title: product?.title ?? "Item",
      quantity: Number(item.quantity || 0),
      price_at_purchase: Number(item.price_at_purchase ?? 0),
      image_url: product?.image_url ?? null,
      category: product?.category ?? null,
    });
    itemsByOrder.set(item.order_id, list);
  }

  const rows: AdminOrderRow[] = orders.map((order) => ({
    id: order.id,
    created_at: order.created_at,
    customer_name: order.customer_name ?? "",
    customer_phone: order.customer_phone ?? "",
    shipping_address: order.shipping_address ?? "",
    city: order.city ?? "",
    notes: order.notes ?? null,
    near_landmark: order.near_landmark ?? null,
    tracking_number: order.tracking_number ?? null,
    total_amount: Number(order.total_amount || 0),
    status: String(order.status ?? "pending"),
    items: itemsByOrder.get(order.id) ?? [],
  }));

  return (
    <main className="min-h-screen bg-[#f1efe9] px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-14 dark:bg-slate-950">
      <div className="mx-auto max-w-[1400px]">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d4b06a]">Commerce</p>
        <h1 className="mt-3 font-serif font-black text-4xl sm:text-5xl">Orders</h1>
        <p className="mt-2 text-sm text-black/50 dark:text-slate-400">
          Click any row for full details · change status inline · use the ⋮ menu to delete.
        </p>
        <div className="mt-8">
          <AdminOrdersView rows={rows} />
        </div>
      </div>
    </main>
  );
}
