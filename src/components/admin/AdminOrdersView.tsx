"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, MoreVertical, Trash2, X } from "lucide-react";

import { deleteOrder, updateOrderStatus } from "@/app/admin/actions";

export interface AdminOrderItem {
  title: string;
  quantity: number;
  price_at_purchase: number;
  image_url: string | null;
  category: string | null;
}

export interface AdminOrderRow {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  total_amount: number;
  status: string;
  items: AdminOrderItem[];
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const formatPKR = (value: number) =>
  `PKR ${Number(value || 0).toLocaleString("en-PK")}`;

/** Editable status dropdown that updates Supabase immediately. */
function StatusSelect({ orderId, value }: { orderId: string; value: string }) {
  const router = useRouter();
  const normalized = (value ?? "").toLowerCase();
  const [pending, start] = useTransition();
  const [current, setCurrent] = useState(normalized);
  return (
    <select
      value={current}
      disabled={pending}
      // Keep row-click (detail modal) from firing when using the dropdown.
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => {
        const next = event.target.value;
        setCurrent(next);
        start(async () => {
          const result = await updateOrderStatus(orderId, next);
          if (result.error) {
            console.error("Status update failed:", result.error);
            setCurrent(normalized); // revert — DB kept the old value
            return;
          }
          // Re-fetch the server rows so the table shows the PERSISTED value.
          router.refresh();
        });
      }}
      className={`cursor-pointer rounded-md border px-2 py-1.5 text-xs capitalize outline-none transition ${
        current === "delivered"
          ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
          : current === "shipped"
            ? "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
            : current === "cancelled"
              ? "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/60 dark:text-red-300"
              : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
      } disabled:opacity-60`}
    >
      <option value="pending">Pending</option>
      <option value="shipped">Shipped</option>
      <option value="delivered">Delivered</option>
      <option value="cancelled">Cancelled</option>
    </select>
  );
}

/** Full-order detail modal with close (X), status control, and delete. */
function OrderDetailModal({
  order,
  onClose,
  onDeleted,
}: {
  order: AdminOrderRow;
  onClose: () => void;
  onDeleted: (orderId: string) => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const itemsTotal = order.items.reduce((sum, item) => sum + item.price_at_purchase * item.quantity, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Order ${order.id.slice(0, 8)} details`}
    >
      <div
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b58a3a]">Order details</p>
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

        <div className="space-y-6 px-6 py-5">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Placed on</p>
              <p className="mt-1 text-slate-800 dark:text-slate-200">{formatDateTime(order.created_at)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</p>
              <div className="mt-1"><StatusSelect orderId={order.id} value={order.status} /></div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer</p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{order.customer_name || "Guest"}</p>
              <p className="text-slate-500 dark:text-slate-400">{order.customer_phone || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Delivery address</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">{order.shipping_address}</p>
              <p className="text-slate-500 dark:text-slate-400">{order.city}</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Items ({order.items.length})
            </p>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {order.items.map((item, index) => (
                <div key={`${item.title}-${index}`} className="flex items-center gap-3 px-4 py-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.title} className="size-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.category ?? "—"} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatPKR(item.price_at_purchase * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Total</span>
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">{formatPKR(itemsTotal)}</span>
          </div>

          {error ? <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p> : null}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Permanently delete order #${order.id.slice(0, 8)} and all of its items?`)) return;
              start(async () => {
                const result = await deleteOrder(order.id);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                onDeleted(order.id);
              });
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:hover:bg-red-950/50"
          >
            <Trash2 className="size-4" />
            {pending ? "Deleting…" : "Delete order"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminOrdersView({ rows }: { rows: AdminOrderRow[] }) {
  const router = useRouter();
  const [detailId, setDetailId] = useState<string | null>(null);
  // Floating menu rendered with FIXED coordinates at the document root of this
  // component — never inside the scrolling/clipping table container — so it
  // always appears fully on top and is never cut off.
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const detailOrder = rows.find((row) => row.id === detailId) ?? null;

  const openMenu = (orderId: string, anchor: HTMLElement) => {
    if (menu?.id === orderId) {
      setMenu(null);
      return;
    }
    const rect = anchor.getBoundingClientRect();
    const MENU_WIDTH = 176;
    const MENU_HEIGHT = 96;
    const x = Math.max(rect.right - MENU_WIDTH, 8);
    const flipUp = rect.bottom + MENU_HEIGHT + 8 > window.innerHeight;
    const y = flipUp ? Math.max(rect.top - MENU_HEIGHT - 6, 8) : rect.bottom + 6;
    setMenu({ id: orderId, x, y });
  };

  const removeOrder = (orderId: string) => {
    setMenu(null);
    if (!window.confirm(`Permanently delete order #${orderId.slice(0, 8)} and all of its items?`)) return;
    startDelete(async () => {
      const result = await deleteOrder(orderId);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }
      // Re-fetch server rows so the deleted order disappears for good.
      router.refresh();
    });
  };

  return (
    <div className="relative">
      {deleteError ? (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {deleteError}
        </p>
      ) : null}
      {/* Fluid table — no min-width and no horizontal scroll. Middle columns
          (Date, Item count) progressively hide on narrower screens while the
          critical left columns (Order ID → Contact) and right columns
          (Status, Actions) always stay visible. */}
      {/* overflow-hidden + rounded-2xl clip the row hover background and any
          action bleed at the card's rounded corners — nothing can escape the
          container's right edge regardless of sidebar width. */}
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 text-[10px] uppercase tracking-widest text-black/40 dark:border-white/10 dark:text-slate-500">
            <tr>
              <th className="px-3 py-4 xl:px-4">Order ID</th>
              <th className="hidden px-3 py-4 sm:table-cell xl:px-4">Image</th>
              <th className="hidden px-3 py-4 md:table-cell xl:px-4">Category</th>
              <th className="px-3 py-4 xl:px-4">Product</th>
              <th className="px-3 py-4">Contact / Address</th>
              <th className="hidden px-3 py-4 lg:table-cell xl:px-4">Date &amp; Time</th>
              <th className="px-3 py-4">Total</th>
              <th className="hidden px-3 py-4 xl:table-cell xl:px-4">Items</th>
              <th className="px-3 py-4">Status</th>
              <th className="px-3 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((order) => {
              const first = order.items[0];
              const extra = order.items.length - 1;
              return (
                <tr
                  key={order.id}
                  onClick={() => setDetailId(order.id)}
                  className="cursor-pointer border-b border-black/8 transition last:border-0 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-slate-800/50"
                >
                  <td className="whitespace-nowrap px-3 py-4 font-mono text-xs text-slate-600 xl:px-4 dark:text-slate-300">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="hidden px-3 py-4 sm:table-cell xl:px-4">
                    <div className="size-11 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                      {first?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={first.image_url} alt={first?.title ?? "Product"} className="size-full object-cover" />
                      ) : null}
                    </div>
                  </td>
                  <td className="hidden max-w-[90px] truncate px-3 py-4 text-xs capitalize text-black/60 md:table-cell xl:max-w-none xl:px-4 dark:text-slate-400">
                    {first?.category ?? "—"}
                    {extra > 0 ? <span className="ml-1 text-black/35 dark:text-slate-500">+{extra}</span> : null}
                  </td>
                  <td className="max-w-[130px] px-3 py-4 sm:max-w-[150px] lg:max-w-[180px] xl:max-w-[200px] xl:px-4">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {first?.title ?? "—"}
                    </p>
                    {extra > 0 ? <p className="truncate text-xs text-black/40 dark:text-slate-500">+{extra} more item{extra === 1 ? "" : "s"}</p> : null}
                  </td>
                  <td className="max-w-[140px] px-3 py-4 text-xs text-black/55 sm:max-w-[170px] xl:max-w-[220px] dark:text-slate-300">
                    <p className="truncate font-semibold">{order.customer_name || "Guest"}</p>
                    <p className="truncate">{order.customer_phone || "—"}</p>
                    <p className="truncate text-black/45 dark:text-slate-500">{order.shipping_address}, {order.city}</p>
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-4 text-xs text-black/50 lg:table-cell xl:px-4 dark:text-slate-400">
                    {formatDateTime(order.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 font-bold text-emerald-700 xl:px-4 dark:text-emerald-400">
                    {formatPKR(order.total_amount)}
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-4 text-black/55 xl:table-cell xl:px-4 dark:text-slate-300">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} pc
                  </td>
                  <td className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                    <StatusSelect orderId={order.id} value={order.status} />
                  </td>
                  <td className="px-4 py-4 text-right" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      aria-label={`Actions for order #${order.id.slice(0, 8)}`}
                      aria-haspopup="menu"
                      aria-expanded={menu?.id === order.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        openMenu(order.id, event.currentTarget);
                      }}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <MoreVertical className="size-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-5 py-14 text-center text-sm text-black/45 dark:text-slate-400">
                  No orders have arrived yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Floating actions menu — FIXED positioning above every other element
          (z-[70] beats the z-50 modal), so it can never be clipped by the
          scrolling table container or any parent boundary. Click anywhere to
          dismiss. */}
      {menu ? (
        <div className="fixed inset-0 z-[60]" onClick={() => setMenu(null)} aria-hidden="true" />
      ) : null}
      {menu ? (
        <div
          role="menu"
          aria-label={`Actions for order #${menu.id.slice(0, 8)}`}
          style={{ top: menu.y, left: menu.x }}
          className="fixed z-[70] w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenu(null);
              setDetailId(menu.id);
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Eye className="size-4" /> View details
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => removeOrder(menu.id)}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            <Trash2 className="size-4" /> Delete order
          </button>
        </div>
      ) : null}

      {detailOrder ? (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailId(null)}
          onDeleted={(deletedId) => {
            setDetailId(null);
            removeOrder(deletedId);
          }}
        />
      ) : null}
    </div>
  );
}



