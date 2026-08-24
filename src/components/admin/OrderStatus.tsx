"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "@/app/admin/actions";

export function OrderStatus({ orderId, value }: { orderId: string; value: string }) {
  const [pending, start] = useTransition();
  return <select disabled={pending} defaultValue={value} onChange={(event) => start(async () => { await updateOrderStatus(orderId, event.target.value); })} className="border border-black/10 bg-transparent px-2 py-2 text-xs capitalize outline-none focus:border-[#b58a3a] dark:border-white/15"><option value="pending">Pending</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select>;
}
