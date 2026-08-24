import { AdminOrdersView, type AdminOrderItem, type AdminOrderRow } from "@/components/admin/AdminOrdersView";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createClient();
  const [{ data: orderData }, { data: itemData }] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    // Plain select — embedded-resource joins silently return empty when the
    // relationship can't be resolved, which wiped out titles/images. We merge
    // products manually below instead.
    supabase.from("order_items").select("order_id, product_id, quantity, price_at_purchase"),
  ]);

  const orders = (orderData ?? []) as Order[];
  const items = (itemData ?? []) as unknown as {
    order_id: string;
    product_id: string | null;
    quantity: number;
    price_at_purchase: number | null;
  }[];

  // Second pass: look up the referenced products directly by id.
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
    total_amount: Number(order.total_amount || 0),
    status: String(order.status ?? "pending"),
    items: itemsByOrder.get(order.id) ?? [],
  }));

  return (
    <main className="min-h-screen bg-[#f1efe9] px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-14 dark:bg-slate-950">
      <div className="mx-auto max-w-[1400px]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b58a3a]">Commerce</p>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl">Orders</h1>
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
