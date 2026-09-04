"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Heart } from "lucide-react";
import { useState } from "react";

import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import type { Product } from "@/types/database";

const formatPKR = (value: number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { isWishlisted, toggle, pendingIds } = useWishlist();
  const saved = isWishlisted(product.id);
  const busy = pendingIds.has(product.id);
  const [imgLoaded, setImgLoaded] = useState(false);

  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round(
          ((product.original_price - product.price) / product.original_price) * 100,
        )
      : null;

  const inStock = product.stock > 0;

  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-emerald-900/20">
      {/* Image container */}
      <Link
        href={`/products/${product.id}`}
        prefetch={true}
        className="relative block aspect-[4/5] w-full overflow-hidden bg-slate-100 dark:bg-slate-800"
      >
        {/* Discount badge */}
        {discount && (
          <span className="absolute left-2.5 top-2.5 z-20 rounded-lg bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            {discount}% OFF
          </span>
        )}

        {/* Wishlist button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle({ id: product.id });
          }}
          disabled={busy}
          aria-pressed={saved}
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute right-2.5 top-2.5 z-20 grid size-8 place-items-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-90 dark:bg-slate-800/90 ${
            saved
              ? "text-rose-500"
              : "text-slate-400 hover:text-rose-500 dark:text-slate-300"
          } ${busy ? "animate-pulse" : ""}`}
        >
          <Heart className={`size-4 transition-transform ${saved ? "fill-current" : ""}`} />
        </button>

        {/* Image */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}>
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              sizes="(max-width: 639px) 46vw, (max-width: 1023px) 30vw, 22vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              onLoad={() => setImgLoaded(true)}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-emerald-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <ShoppingBag className="size-12 text-slate-300 dark:text-slate-600" strokeWidth={1.2} />
            </div>
          )}
        </div>

        {/* Loading shimmer */}
        {!imgLoaded && product.image_url && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />
        )}

        {/* Add to Cart overlay — slides up on hover (desktop) */}
        {inStock && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addItem({
                  productId: product.id,
                  title: product.title,
                  price: product.price,
                  quantity: 1,
                  image_url: product.image_url ?? undefined,
                });
              }}
              className="flex w-full items-center justify-center gap-2 bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              <ShoppingBag className="size-3.5" />
              Add to Cart
            </button>
          </div>
        )}
      </Link>

      {/* Info block */}
      <div className="flex flex-1 flex-col px-3.5 pb-4 pt-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 dark:text-white">
          <Link href={`/products/${product.id}`} className="hover:text-emerald-700 dark:hover:text-emerald-400">
            {product.title}
          </Link>
        </h3>

        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
              {formatPKR(product.price)}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-xs font-medium text-slate-400 line-through">
                {formatPKR(product.original_price)}
              </span>
            )}
          </div>
          {!inStock && (
            <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider text-rose-500">
              Out of stock
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
