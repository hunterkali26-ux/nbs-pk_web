import Link from "next/link";
import type { Metadata } from "next";
import { PackageCheck, Search } from "lucide-react";

import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  NIL_UUID,
  SEARCH_RESULTS_LIMIT,
  rankProducts,
  sanitizeQuery,
} from "@/lib/product-ranking";
import type { Product } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search — VEXIS pk",
  description:
    "Search watches, perfumes and footwear at VEXIS pk — ranked by relevance, popularity and newest arrivals.",
};

const formatPKR = (value: number) => `PKR ${Number(value || 0).toLocaleString("en-PK")}`;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawParam = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = sanitizeQuery(rawParam ?? "");
  const hasQuery = query.length > 0;

  const supabase = await createClient();
  const pattern = `%${query}%`;

  // Parallel round-trip #1:
  //   • matching products (title/description ilike; an impossible id filter
  //     keeps typing uniform when the box is empty)
  //   • lifetime sales per product — "frequently ordered" ranking signal
  //     (degrades gracefully to zero if order_items is unavailable).
  const [productsRes, soldRes] = await Promise.all([
    hasQuery
      ? supabase
          .from("products")
          .select("*")
          .or(`title.ilike.${pattern},description.ilike.${pattern}`)
          .limit(SEARCH_RESULTS_LIMIT)
      : supabase.from("products").select("*").eq("id", NIL_UUID).limit(1),
    supabase.from("order_items").select("product_id, quantity"),
  ]);

  const salesById = new Map<string, number>();
  for (const row of (soldRes.data ?? []) as unknown as {
    product_id: string | null;
    quantity: number;
  }[]) {
    if (!row.product_id) continue;
    salesById.set(row.product_id, (salesById.get(row.product_id) ?? 0) + Number(row.quantity || 0));
  }

  const products = rankProducts(
    (productsRes.data ?? []) as unknown as Product[],
    query,
    salesById,
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-400">
          <Search className="size-4" />
          Search
        </p>

        {hasQuery ? (
          <>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Results for “{query}”
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {products.length} {products.length === 1 ? "product" : "products"} · ranked by
              relevance, popularity and newest arrivals
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Search the store.
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
              Type at least one letter in the search bar above to find watches, perfumes,
              footwear and more.
            </p>
          </>
        )}

        {/* No query yet -------------------------------------------------- */}
        {!hasQuery ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <Search className="mx-auto size-12 text-slate-300 dark:text-slate-600" strokeWidth={1} />
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              What are you looking for?
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try a product name, a brand, or a material.
            </p>
            <Link
              href="/shop"
              prefetch={true}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
            >
              Browse everything
            </Link>
          </div>
        ) : products.length === 0 ? (
          /* Genuine zero matches ----------------------------------------- */
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <PackageCheck className="mx-auto size-12 text-slate-300 dark:text-slate-600" strokeWidth={1} />
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Nothing matched “{query}”
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Check the spelling or try a broader term.
            </p>
            <Link
              href="/shop"
              prefetch={true}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
            >
              Browse all products
            </Link>
          </div>
        ) : (
          /* Ranked results grid ------------------------------------------ */
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`} prefetch={true} className="group min-w-0">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-emerald-100 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                  {product.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={product.image_url}
                      alt={product.title}
                      loading="lazy"
                      className="size-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center">
                      <PackageCheck className="size-14 text-slate-300 dark:text-slate-600" strokeWidth={1} />
                    </div>
                  )}
                                    {(salesById.get(product.id) ?? 0) >= 5 ? (
                    <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                      Best seller
                    </span>
                  ) : null}
                  <WishlistButton productId={product.id} productTitle={product.title} />
                </div>
                <h2 className="mt-3 truncate text-sm font-bold capitalize text-slate-900 dark:text-white">
                  {product.title}
                </h2>
                <p className="mt-1 text-base font-black text-emerald-700 dark:text-emerald-400">
                  {formatPKR(product.price)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
