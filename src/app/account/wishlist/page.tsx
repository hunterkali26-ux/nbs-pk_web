import type { Metadata } from "next";

import { WishlistView } from "@/components/account/WishlistView";
import { createClient } from "@/lib/supabase/server";
import type { Product, Wishlist } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My wishlist — NBS-pk",
};

export default async function WishlistPage() {
  const supabase = await createClient();

  // The account layout already guarantees a signed-in user here.
  const { data: wishRows } = await supabase
    .from("wishlist")
    .select("*")
    .order("created_at", { ascending: false });
  const wishes = (wishRows ?? []) as Wishlist[];

  // Manual merge keeps rendering robust even if a product was deleted after
  // being saved (same pattern the orders views use).
  const productIds = [...new Set(wishes.map((row) => row.product_id))];
  const byId = new Map<string, Product>();

  if (productIds.length > 0) {
    const { data: productRows } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds);
    for (const row of (productRows ?? []) as Product[]) {
      byId.set(row.id, row);
    }
  }

  const entries = wishes.flatMap((row) => {
    const product = byId.get(row.product_id);
    return product ? [{ savedAt: row.created_at, product }] : [];
  });

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
        Saved for later
      </p>
      <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
        My wishlist
      </h1>

      {/* Client island handles optimistic removal while hearts elsewhere in
          the app stay perfectly in sync through the shared context. */}
      <WishlistView entries={entries} />
    </div>
  );
}
