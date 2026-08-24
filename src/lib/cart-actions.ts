"use server";

import { createClient } from "@/lib/supabase/server";
import type { CartItem, CartItemInsert, Product } from "@/types/database";

/** A cart item enriched with product display details (for the client UI). */
export interface CartLine {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image_url?: string;
}

/**
 * Load the persisted cart_items for a user, joined with product details.
 * Returns an empty array when there is nothing stored (or the table is not
 * migrated yet — the caller gracefully keeps a localStorage-only mode).
 */
export async function getUserCart(userId: string): Promise<CartLine[]> {
  try {
    const supabase = await createClient();

    const { data: cartRows, error } = await supabase
      .from("cart_items")
      .select("product_id, quantity")
      .eq("user_id", userId);

    if (error) {
      console.warn("getUserCart failed:", error.message);
      return [];
    }

    const rows = (cartRows ?? []) as Pick<CartItem, "product_id" | "quantity">[];
    if (rows.length === 0) return [];

    const ids = rows.map((row) => row.product_id);
    const { data } = (await supabase
      .from("products")
      .select("id, title, price, image_url")
      .in("id", ids)) as unknown as {
      data: Pick<Product, "id" | "title" | "price" | "image_url">[] | null;
    };

    const productList = (data ?? []) as Pick<Product, "id" | "title" | "price" | "image_url">[];

    const productMap = new Map<string, Pick<Product, "id" | "title" | "price" | "image_url">>(
      productList.map((p) => [p.id, p]),
    );

    return rows
      .filter((row) => productMap.has(row.product_id))
      .map((row) => {
        const product = productMap.get(row.product_id)!;
        return {
          productId: product.id,
          title: product.title,
          price: product.price,
          quantity: row.quantity,
          image_url: product.image_url ?? undefined,
        };
      });
  } catch (err) {
    console.warn("getUserCart threw:", err);
    return [];
  }
}

/**
 * Persist a user's cart_items — one row per (user, product) via upsert on the
 * composite key, so it never duplicates. Returns true on success so callers
 * can react when the DB isn't available yet.
 */
export async function syncCart(userId: string, lines: CartLine[]): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Remove rows dropped client-side, then upsert the current lines.
    if (lines.length === 0) {
      await clearUserCart(userId);
      return true;
    }

    // Fetch what's currently stored so we only delete the rows that are no
    // longer in the client cart (instead of wiping + re-inserting everything).
    const { data: existingRows } = await supabase
      .from("cart_items")
      .select("product_id")
      .eq("user_id", userId);
    const existing = (existingRows ?? []) as Pick<CartItem, "product_id">[];

    const keepIds = new Set(lines.map((line) => line.productId));
    const toRemove = existing
      .map((row) => row.product_id)
      .filter((productId) => !keepIds.has(productId));

    if (toRemove.length > 0) {
      await supabase.from("cart_items").delete().eq("user_id", userId).in("product_id", toRemove);
    }

    const rows: CartItemInsert[] = lines.map((line) => ({
      user_id: userId,
      product_id: line.productId,
      quantity: line.quantity,
    }));

    const { error } = await supabase.from("cart_items").upsert(rows as never[], {
      onConflict: "user_id,product_id",
    });
    if (error) {
      console.error("Cart sync failed:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("syncCart threw:", err);
    return false;
  }
}

/** Delete every cart_items row belonging to the given user (e.g. after checkout). */
export async function clearUserCart(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("cart_items").delete().eq("user_id", userId);
    if (error) {
      console.error("Cart clear failed:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("clearUserCart threw:", err);
    return false;
  }
}

/** True when the cart_items table is reachable — used to decide DB vs local mode. */
export async function isCartReady(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("cart_items").select("user_id").limit(1);
    return !error;
  } catch {
    return false;
  }
}