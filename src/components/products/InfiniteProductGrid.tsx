"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PackageCheck } from "lucide-react";

import { getProducts } from "@/app/auth/actions";
import { useCart } from "@/lib/cart-context";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import type { Product } from "@/types/database";

interface InfiniteProductGridProps {
  category?: string;
  initialLimit?: number;
  /** Page 0 rows rendered on the server (home page SSR feed). */
  initialProducts?: Product[];
}

const SkeletonLoader = () => (
  <div className="aspect-[4/5] animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
);

export function InfiniteProductGrid({
  category,
  initialLimit = 12,
  initialProducts,
}: InfiniteProductGridProps) {
  const seeded = Boolean(initialProducts && initialProducts.length > 0);
  const [products, setProducts] = useState<Product[]>(seeded ? initialProducts! : []);
  const [page, setPage] = useState(seeded ? 1 : 0);
  // When the server already delivered a partial first page, there may be nothing left.
  const [hasMore, setHasMore] = useState(seeded ? initialProducts!.length >= initialLimit : true);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const result = await getProducts(page, initialLimit, category);
    if (result.error) {
      console.error("Failed to load products:", result.error);
      setLoading(false);
      return;
    }
    // Deduplicate by product id so the same row can never render twice.
    setProducts((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      const fresh = result.products.filter((p) => !seen.has(p.id));
      return [...prev, ...fresh];
    });
    setHasMore(result.products.length === initialLimit);
    setPage((p) => p + 1);
    setLoading(false);
  }, [page, loading, hasMore, category, initialLimit]);

  useEffect(() => {
    // Skip the first fetch when the server already supplied page 0.
    if (!seeded) void loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          void loadMore();
        }
      },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);

  if (products.length === 0 && !loading) {
    return (
      <div className="px-4 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
        No products found. Check back soon!
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.map((product) => (
          <article key={product.id} className="group min-w-0">
            <Link href={`/products/${product.id}`} prefetch={true} className="block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-emerald-100 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <div className="absolute inset-0 grid place-items-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="size-full object-cover"
                    />
                  ) : (
                    <PackageCheck className="size-20 text-slate-300 dark:text-slate-600" strokeWidth={1} />
                  )}
                </div>
                                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-slate-900/90 dark:text-emerald-400">
                  {product.category}
                </span>
                <WishlistButton productId={product.id} productTitle={product.title} />
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
                  aria-label={`Add ${product.title} to cart`}
                  className="absolute bottom-3 left-3 right-3 translate-y-2 cursor-pointer rounded-lg bg-white px-3 py-2.5 text-xs font-bold text-slate-900 opacity-0 shadow transition group-hover:translate-y-0 group-hover:opacity-100 hover:bg-emerald-50 active:bg-emerald-100 dark:bg-slate-100 dark:hover:bg-emerald-950 dark:active:bg-emerald-900"
                >
                  Add to cart
                </button>
              </div>
              <h3 className="mt-4 truncate text-sm font-bold text-slate-900 dark:text-white">
                {product.title}
              </h3>
              <p className="mt-1 text-lg font-black text-emerald-700 dark:text-emerald-400">
                PKR {product.price.toLocaleString("en-PK")}
              </p>
            </Link>
          </article>
        ))}
      </div>
      {loading && (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} />
          ))}
        </div>
      )}
      {hasMore && <div ref={sentinelRef} className="h-8" />}
      {!hasMore && products.length > 0 && (
        <p className="mt-8 text-center text-sm text-slate-400 dark:text-slate-500">
          You&apos;ve reached the end of the collection.
        </p>
      )}
    </>
  );
}
