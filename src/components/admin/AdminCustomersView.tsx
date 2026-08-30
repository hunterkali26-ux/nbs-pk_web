"use client";

import { useState } from "react";
import { ShoppingBag, UserRound, X } from "lucide-react";

export interface AdminCustomerOrder {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  city: string;
}

export interface AdminCustomer {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  address: string | null;
  role: string;
  created_at: string;
  orderCount: number;
  totalSpend: number;
  orders: AdminCustomerOrder[];
}

const formatPKR = (value: number) =>
  `PKR ${Number(value || 0).toLocaleString("en-PK")}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const statusTone = (status: string) => {
  const normalized = (status ?? "").toLowerCase();
  return normalized === "delivered"
    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
    : normalized === "cancelled"
      ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400"
      : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400";
};

export function AdminCustomersView({ customers }: { customers: AdminCustomer[] }) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = customers.find((customer) => customer.id === detailId) ?? null;

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 text-[10px] uppercase tracking-widest text-black/40 dark:border-white/10 dark:text-slate-500">
            <tr>
              <th className="px-4 py-4 sm:px-5">Full name</th>
              <th className="px-4 py-4 sm:px-5">Phone</th>
              <th className="hidden px-4 py-4 md:table-cell sm:px-5">Address</th>
              <th className="px-4 py-4 sm:px-5">Role</th>
              <th className="hidden whitespace-nowrap px-4 py-4 sm:table-cell sm:px-5">Registered</th>
              <th className="px-4 py-4 text-right sm:px-5">Orders</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr
                key={customer.id}
                onClick={() => setDetailId(customer.id)}
                className="cursor-pointer border-b border-black/8 last:border-0 hover:bg-slate-50/60 dark:border-white/10 dark:hover:bg-slate-800/40"
              >
                <td className="max-w-[160px] truncate px-4 py-4 font-semibold sm:px-5">
                  <span className="flex items-center gap-2">
                    <UserRound className="size-4 shrink-0 text-slate-400 dark:text-slate-500" />
                    {customer.full_name || "Unnamed"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-black/60 sm:px-5 dark:text-slate-300">
                  {customer.phone_number || "—"}
                </td>
                <td className="hidden max-w-[220px] truncate px-4 py-4 text-black/60 md:table-cell sm:px-5 dark:text-slate-300">
                  {customer.address || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-4 capitalize text-[#d4b06a] sm:px-5">{customer.role}</td>
                <td className="hidden whitespace-nowrap px-4 py-4 text-black/50 sm:table-cell sm:px-5 dark:text-slate-400">
                  {formatDate(customer.created_at)}
                </td>
                <td className="px-4 py-4 text-right sm:px-5">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {customer.orderCount}
                  </span>
                </td>
              </tr>
            ))}
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-sm text-black/45 dark:text-slate-400">
                  No registered users yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {detail ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => setDetailId(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Customer profile for ${detail.full_name ?? "unnamed customer"}`}
        >
          <div
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4b06a]">Customer profile</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  {detail.full_name || "Unnamed customer"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailId(null)}
                aria-label="Close customer details"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</p>
                  <p className="mt-1 break-words text-slate-800 dark:text-slate-200">
                    {detail.email || "Not on file"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone</p>
                  <p className="mt-1 text-slate-800 dark:text-slate-200">{detail.phone_number || "—"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Address</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">{detail.address || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Role</p>
                  <p className="mt-1 capitalize text-slate-800 dark:text-slate-200">{detail.role}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Registered</p>
                  <p className="mt-1 text-slate-800 dark:text-slate-200">{formatDate(detail.created_at)}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Orders</p>
                  <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{detail.orderCount}</p>
                </div>
                <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total spent</p>
                  <p className="mt-1 text-sm font-black text-emerald-700 dark:text-emerald-400">
                    {formatPKR(detail.totalSpend)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Last order</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {detail.orders.length > 0 ? formatDate(detail.orders[0].created_at) : "—"}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Order history</p>
                {detail.orders.length === 0 ? (
                  <p className="rounded-xl border border-slate-200 px-4 py-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    No orders placed yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                    {detail.orders.map((order) => (
                      <div key={order.id} className="flex items-center gap-3 px-4 py-3">
                        <ShoppingBag className="size-4 shrink-0 text-slate-400 dark:text-slate-500" />
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-xs text-slate-600 dark:text-slate-300">#{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(order.created_at)} · {order.city || "—"}
                          </p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone(order.status)}`}>{order.status}</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatPKR(order.total_amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
              <button
                type="button"
                onClick={() => setDetailId(null)}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}