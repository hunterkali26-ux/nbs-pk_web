import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageCheck } from "lucide-react";

import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Category, Product } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  const cat = category as Category | null;

  if (!cat) notFound();

  // Products tag their category by NAME (case-insensitive); older rows may
  // store the SLUG instead, so fall back to a slug match when empty.
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .ilike("category", cat.name)
    .order("created_at", { ascending: false });

  let list = (products ?? []) as Product[];

  if (productsError) {
    console.error(
      `Failed to load products for category "${cat.slug}":`,
      productsError.message,
    );
  }

  if (!productsError && list.length === 0) {
    const { data: bySlug } = await supabase
      .from("products")
      .select("*")
      .eq("category", cat.slug)
      .order("created_at", { ascending: false });
    list = (bySlug ?? []) as Product[];
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
          ← Back to home
        </Link>
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">Category</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{cat.name}</h1>
          <span className="mt-3 inline-block rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            {list.length} {list.length === 1 ? "product" : "products"}
          </span>
        </div>

        {list.length === 0 ? (
          <div className="mt-10 border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <PackageCheck className="mx-auto size-12 text-slate-300 dark:text-slate-600" strokeWidth={1} />
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">No products in this category yet</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Check back soon for new arrivals.</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {list.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group min-w-0"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-emerald-100 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center">
                      <PackageCheck className="size-16 text-slate-300 dark:text-slate-600" strokeWidth={1} />
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-slate-900/90 dark:text-emerald-300">
                    {product.category}
                  </span>
                  <WishlistButton productId={product.id} productTitle={product.title} />
                </div>
                <h3 className="mt-4 truncate text-sm font-bold text-slate-900 dark:text-white">{product.title}</h3>
                <p className="mt-1 text-lg font-black text-emerald-700 dark:text-emerald-400">
                  PKR {product.price.toLocaleString("en-PK")}
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