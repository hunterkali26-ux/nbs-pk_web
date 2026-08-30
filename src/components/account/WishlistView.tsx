"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Heart, PackageCheck, ShoppingBag, Trash2 } from "lucide-react";

import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/types/database";

export interface WishlistEntry {
  savedAt: string;
  product: Product;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export function WishlistView({ entries }: { entries: WishlistEntry[] }) {
  const { remove } = useWishlist();
  const { addItem } = useCart();
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleRemove = (productId: string) => {
    setRemovedIds((prev) => new Set(prev).add(productId));
    remove(productId);
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      title: product.title,
      price: Number(product.price),
      quantity: 1,
      image_url: product.image_url ?? undefined,
    });
    setAddedIds((prev) => new Set(prev).add(product.id));
    // Clear the "Added ✓" flash shortly so it stays meaningful.
    window.setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1600);
  };

  const visible = entries.filter(
    ({ product }) => !removedIds.has(product.id),
  );

  if (visible.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
        <Heart className="mx-auto size-12 text-slate-300 dark:text-slate-600" strokeWidth={1} />
        <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
          {entries.length === 0 ? "Your wishlist is empty" : "All clear"}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tap the heart on any product to save it for later.
        </p>
        <Link
          href="/shop"
          prefetch={true}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
        >
          Browse everything
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <PackageCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
        {visible.length} saved {visible.length === 1 ? "item" : "items"}
      </p>

      <ul className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {visible.map(({ savedAt, product }) => {
          const isAdded = addedIds.has(product.id);
          return (
            <li key={product.id} className="flex items-center gap-3 px-3 py-3 sm:px-4">
              <Link href={`/products/${product.id}`} prefetch={true} aria-label={product.title} className="shrink-0">
                <span className="flex size-16 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-emerald-100 to-slate-100 sm:size-20 dark:from-slate-800 dark:to-slate-900">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt={product.title} loading="lazy" className="size-full object-cover" />
                  ) : (
                    <PackageCheck className="size-7 text-slate-300 dark:text-slate-600" strokeWidth={1} />
                  )}
                </span>
              </Link>

              <div className="min-w-0 flex-1">
                <Link href={`/products/${product.id}`} prefetch={true}>
                  <h3 className="truncate text-sm font-bold capitalize text-slate-900 dark:text-white">
                    {product.title}
                  </h3>
                </Link>
                <p className="mt-0.5 text-sm font-black text-emerald-700 dark:text-emerald-400">
                  PKR {Number(product.price).toLocaleString("en-PK")}
                </p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Saved {formatDate(savedAt)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      isAdded
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-emerald-700 text-white hover:bg-emerald-800"
                    }`}
                  >
                    {isAdded ? <Check className="size-3.5" aria-hidden="true" /> : <ShoppingBag className="size-3.5" aria-hidden="true" />}
                    {isAdded ? "Added" : "Add to cart"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(product.id)}
                    aria-label={`Remove ${product.title} from wishlist`}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
