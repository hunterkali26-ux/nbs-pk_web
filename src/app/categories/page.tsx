import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Footprints, Flame, PackageCheck, Sparkles, Watch, ArrowRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductSkeletonGrid } from "@/components/products/ProductSkeleton";
import { EmptyState } from "@/components/products/EmptyState";
import type { Category, Product } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories — VEXIS pk",
  description:
    "Browse every category at VEXIS pk — watches, perfumes, footwear and more, each with live products, real images and prices.",
};

/** Fallback glyph shown while a category has no uploaded cover photo yet. */
const FALLBACK_ICONS = [Watch, Sparkles, Footprints] as const;

const PRODUCTS_PER_SECTION = 4;

/* ─── Category Card ───────────────────────────────────────────────── */

function CategoryCard({
  category,
  totalProducts,
  fallbackIcon: FallbackIcon,
}: {
  category: Category;
  totalProducts: number;
  fallbackIcon: typeof Watch;
}) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Cover image with gradient overlay */}
      <span className="relative block aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-emerald-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        {category.image_url ? (
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            sizes="(max-width: 639px) 94vw, (max-width: 1279px) 46vw, 30vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center">
            <FallbackIcon className="size-14 text-emerald-600/40 dark:text-emerald-300/40" strokeWidth={1.2} />
          </span>
        )}
        {/* Gradient overlay */}
        <span className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {/* Product count badge */}
        <span className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-700 backdrop-blur-sm dark:bg-slate-900/90 dark:text-slate-200">
          {totalProducts} {totalProducts === 1 ? "Item" : "Items"}
        </span>
      </span>

      {/* Name block */}
      <span className="flex flex-1 items-center justify-between px-5 py-4">
        <span className="text-base font-black capitalize text-slate-900 dark:text-white">
          {category.name}
        </span>
        <span className="grid size-8 translate-x-2 place-items-center rounded-full bg-slate-100 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 dark:bg-slate-800">
          <ArrowRight className="size-3.5 text-slate-600 dark:text-slate-300" />
        </span>
      </span>
    </Link>
  );
}

/* ─── Product Section ─────────────────────────────────────────────── */

function ProductSection({
  title,
  icon,
  products,
  loading,
}: {
  title: string;
  icon: React.ReactNode;
  products: Product[];
  loading?: boolean;
}) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-2.5">
        {icon}
        <h2 className="text-xl font-black text-slate-900 dark:text-white">{title}</h2>
      </div>
      {loading ? (
        <ProductSkeletonGrid count={PRODUCTS_PER_SECTION} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products yet"
          message="Products are being added to this section. Check back soon!"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */

export default async function CategoriesPage() {
  const supabase = await createClient();

  // Fetch all categories with product counts
  const { data: categoryRows } = await supabase.from("categories").select("*").order("name");
  const categories = (categoryRows ?? []) as Category[];

  // Fetch product counts for each category
  const categoryCards = await Promise.all(
    categories.map(async (category, index) => {
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .ilike("category", category.name);

      return { category, totalProducts: count ?? 0, index };
    }),
  );

  // Fetch "Best Sellers" — products with lowest stock (proxy for most sold)
  const { data: bestSellers } = await supabase
    .from("products")
    .select("*")
    .gt("stock", 0)
    .order("stock", { ascending: true })
    .limit(PRODUCTS_PER_SECTION);

  // Fetch "New Arrivals" — latest products by created_at
  const { data: newArrivals } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(PRODUCTS_PER_SECTION);

  const bestSellerProducts = (bestSellers ?? []) as Product[];
  const newArrivalProducts = (newArrivals ?? []) as Product[];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ─── Categories Grid ─────────────────────────────────── */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-400">
                Browse
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Explore Categories
              </h1>
            </div>
            <Link
              href="/shop"
              className="hidden items-center gap-1.5 text-sm font-bold text-emerald-700 transition hover:text-emerald-800 sm:inline-flex dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              View all products
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {categories.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <PackageCheck className="size-6 text-slate-300 dark:text-slate-600" strokeWidth={1.2} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">No categories yet</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Categories are being curated — check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {categoryCards.map(({ category, totalProducts, index }) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  totalProducts={totalProducts}
                  fallbackIcon={FALLBACK_ICONS[index % FALLBACK_ICONS.length]}
                />
              ))}
            </div>
          )}
        </section>

        {/* ─── Featured Products ────────────────────────────────── */}
        <section className="mt-14 space-y-10">
          <ProductSection
            title="Best Sellers"
            icon={<Flame className="size-6 text-orange-500" />}
            products={bestSellerProducts}
          />
          <ProductSection
            title="New Arrivals"
            icon={<Sparkles className="size-6 text-emerald-600 dark:text-emerald-400" />}
            products={newArrivalProducts}
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}
