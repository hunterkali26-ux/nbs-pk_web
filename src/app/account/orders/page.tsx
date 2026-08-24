"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EyeOff, LoaderCircle, PackageOpen, Phone, RotateCcw, X } from "lucide-react";
import type { Order } from "@/types/database";

// Orders hidden from THIS browser's personal view only. Admin records in the
// Supabase `orders` table are never touched (business permanence preserved).
const HIDDEN_KEY = "vexis-hidden-orders";

const readHidden = (): string[] => {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

interface CustomerOrderItem {
  title: string;
  quantity: number;
  price_at_purchase: number;
  image_url: string | null;
  category: string | null;
}

/** Full order detail modal with a clear X close button. */
function OrderDetailModal({
  order,
  items,
  onClose,
  onHide,
}: {
  order: Order;
  items: CustomerOrderItem[];
  onClose: () => void;
  onHide: (orderId: string) => void;
}) {
  const itemsTotal = items.reduce((sum, item) => sum + item.price_at_purchase * item.quantity, 0);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Order ${order.id.slice(0, 8)} details`}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">Your order</p>
            <h3 className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-white">#{order.id.slice(0, 8)}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order details"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Placed on</p>
              <p className="mt-1 text-slate-800 dark:text-slate-200">{formatDateTime(order.created_at)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</p>
              <p className="mt-1 capitalize text-slate-800 dark:text-slate-200">{order.status}</p>
            </div>
            {order.shipping_address ? (
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Delivered to</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{order.shipping_address}</p>
              </div>
            ) : null}
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Items ({items.length})</p>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {items.map((item, index) => (
                <div key={`${item.title}-${index}`} className="flex items-center gap-3 px-4 py-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.title} className="size-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    PKR {(item.price_at_purchase * item.quantity).toLocaleString("en-PK")}
                  </p>
                </div>
              ))}
              {items.length === 0 ? (
                <p className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">Item details unavailable.</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Total</span>
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
              PKR {Number(order.total_amount || itemsTotal).toLocaleString("en-PK")}
            </span>
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          {/* Always rendered — any order can be hidden from personal view. */}
          <button
            type="button"
            onClick={() => {
              onHide(order.id);
              onClose();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <EyeOff className="size-4" />
            Hide from my history
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// __MAIN_COMPONENT__

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<string, CustomerOrderItem[]>>({});
  const [detailId, setDetailId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return null;
    }

    const { data, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError("Failed to fetch order history.");
    } else if (data) {
      setError(null);
      setOrders(data as Order[]);

      // Fetch each order's lines, then look up products directly by id.
      // (Embedded-resource joins silently return empty when the relationship
      // can't be resolved — a manual merge never loses titles/images.)
      const ids = (data as Order[]).map((order) => order.id);
      if (ids.length > 0) {
        const { data: itemRows } = await supabase
          .from("order_items")
          .select("order_id, product_id, quantity, price_at_purchase")
          .in("order_id", ids);

        const flatItems = (itemRows ?? []) as unknown as {
          order_id: string;
          product_id: string | null;
          quantity: number;
          price_at_purchase: number | null;
        }[];

        const productIds = [
          ...new Set(flatItems.map((item) => item.product_id).filter((id): id is string => Boolean(id))),
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

        const grouped: Record<string, CustomerOrderItem[]> = {};
        for (const row of flatItems) {
          const product = row.product_id ? productMap.get(row.product_id) : undefined;
          const list = grouped[row.order_id] ?? [];
          list.push({
            title: product?.title ?? "Item",
            quantity: Number(row.quantity || 0),
            price_at_purchase: Number(row.price_at_purchase ?? 0),
            image_url: product?.image_url ?? null,
            category: product?.category ?? null,
          });
          grouped[row.order_id] = list;
        }
        setItemsMap(grouped);
      } else {
        setItemsMap({});
      }
    }
    setLoading(false);
    return user.id;
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Declared at effect scope so the cleanup below can always remove it —
    // otherwise a stale subscribed channel survives remounts, and re-calling
    // .channel() with the same topic returns that subscribed channel, making
    // .on(...) throw "cannot add postgres_changes callbacks after subscribe".
    type RealtimeChannel = ReturnType<ReturnType<typeof createClient>["channel"]>;
    let channel: RealtimeChannel | null = null;

    void (async () => {
      const userId = await loadOrders();
      if (cancelled || !userId) return;

      const supabase = createClient();
      // Chain order matters: ALL .on() listeners first, .subscribe() LAST.
      channel = supabase
        .channel(`account-orders-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            // Live sync: refetch so an admin status change (e.g. Pending →
            // Delivered) appears instantly without a manual page refresh.
            void loadOrders();
          },
        )
        .subscribe();
    })();

    setHiddenIds(readHidden());

    return () => {
      cancelled = true;
      if (channel) {
        void createClient().removeChannel(channel);
      }
    };
  }, [loadOrders]);

  const visibleOrders = orders.filter((order) => !hiddenIds.includes(order.id));
  const hiddenCount = orders.length - visibleOrders.length;
  const detailOrder = orders.find((order) => order.id === detailId) ?? null;

  const hideOrder = (orderId: string) => {
    const next = [...new Set([...hiddenIds, orderId])];
    setHiddenIds(next);
    try {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const restoreHidden = () => {
    setHiddenIds([]);
    try {
      localStorage.removeItem(HIDDEN_KEY);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoaderCircle className="size-8 animate-spin text-emerald-700" />
      </div>
    );
  }

  return (
    <div className="border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Order History</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View your previous orders and their current status.</p>

      {/* Prominent cancellation notice — customers cannot self-cancel orders. */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-800/70 dark:bg-amber-950/40">
        <Phone className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
        <p className="text-sm font-semibold leading-6 text-amber-900 dark:text-amber-200">
          If you want to cancel your order, please message us at our given number:{" "}
          <a
            href="tel:+923208684757"
            className="whitespace-nowrap font-black underline decoration-amber-500 underline-offset-2 hover:text-amber-700 dark:hover:text-amber-100"
          >
            0320 8684757
          </a>
        </p>
      </div>

      {error && (
        <p className="mt-6 text-sm text-red-600 font-semibold dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {!error && hiddenCount > 0 ? (
        <button
          type="button"
          onClick={restoreHidden}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          <RotateCcw className="size-3.5" />
          Restore {hiddenCount} hidden order{hiddenCount === 1 ? "" : "s"}
        </button>
      ) : null}

      {!error && visibleOrders.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center py-12 text-center">
          <PackageOpen className="size-12 text-slate-300 dark:text-slate-600" strokeWidth={1} />
          <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">No orders placed yet</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">All your purchases will be listed here.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <th className="px-4 py-3 sm:px-6">Order ID</th>
                <th className="hidden px-4 py-3 sm:table-cell sm:px-6">Date &amp; Time</th>
                <th className="px-4 py-3 sm:px-6">Status</th>
                <th className="px-4 py-3 sm:px-6 text-right">Total Amount</th>
                <th className="px-4 py-3 sm:px-6" aria-label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
              {visibleOrders.map((order) => {
                // Normalize so DB values like 'Pending'/'DELIVERED' style correctly.
                const status = (order.status ?? "").toLowerCase();
                return (
                  <tr
                    key={order.id}
                    onClick={() => setDetailId(order.id)}
                    className="cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-4 font-mono text-xs text-slate-600 sm:px-6 dark:text-slate-300">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-4 text-slate-600 sm:table-cell sm:px-6 dark:text-slate-300">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                          status === "delivered"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : status === "shipped"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                              : status === "cancelled"
                                ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-slate-900 sm:px-6 dark:text-white">
                      PKR {order.total_amount.toLocaleString("en-PK")}
                    </td>
                    <td className="px-4 py-4 text-right sm:px-6">
                      {["delivered", "cancelled"].includes(status) ? (
                        <button
                          type="button"
                          onClick={() => hideOrder(order.id)}
                          title="Hide this order from your history"
                          aria-label={`Hide order #${order.id.slice(0, 8)}`}
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          <EyeOff className="size-4" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {detailOrder ? (
        <OrderDetailModal
          order={detailOrder}
          items={itemsMap[detailOrder.id] ?? []}
          onClose={() => setDetailId(null)}
          onHide={hideOrder}
        />
      ) : null}
      {!error && visibleOrders.length > 0 ? (
        <p className="mt-3 text-[11px] leading-5 text-slate-400 dark:text-slate-500">
          Click any order for full details. Delivered and cancelled orders can be hidden from your
          personal view using the eye icon — records stay intact for business purposes and can be
          restored anytime on this device.
        </p>
      ) : null}
    </div>
  );
}
