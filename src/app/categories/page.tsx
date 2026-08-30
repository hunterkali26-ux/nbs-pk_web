import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Footprints, PackageCheck, Sparkles, Watch } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Category, Product } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories — VEXIS pk",
  description:
    "Browse every category at VEXIS pk — watches, perfumes, footwear and more, each with live products, real images and prices.",
};

const formatPKR = (value: number) => `PKR ${Number(value || 0).toLocaleString("en-PK")}`;

/** Fallback glyph shown while a category has no uploaded cover photo yet. */
const FALLBACK_ICONS = [Watch, Sparkles, Footprints] as const;

/**
 * One category card: the uploaded cover image sits on top with the category
 * name neatly underneath, followed by a live strip of representative products
 * (real photos + PKR prices) pulled straight from Supabase.
 */
function CategoryCard({
  category,
  products,
  totalProducts,
  fallbackIcon: FallbackIcon,
}: {
  category: Category;
  products: Product[];
  totalProducts: number;
  fallbackIcon: typeof Watch;
}) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Cover image ------------------------------------------------------ */}
      <span className="relative block aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-emerald-100 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        {category.image_url ? (
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            sizes="(max-width: 639px) 94vw, (max-width: 1279px) 46vw, 30vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center">
            <FallbackIcon className="size-12 text-emerald-600/60 dark:text-emerald-300/60" strokeWidth={1.25} />
          </span>
        )}
        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
          {totalProducts} {totalProducts === 1 ? "product" : "products"}
        </span>
      </span>

      {/* Name block ------------------------------------------------------- */}
      <span className="flex flex-1 flex-col p-4 sm:p-5">
        <span className="text-lg font-black capitalize text-slate-900 dark:text-white">
          {category.name}
        </span>
        <span className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Shop the {category.name.toLowerCase()} collection.
        </span>
      </span>

      {/* Representative products ------------------------------------------ */}
      {products.length > 0 ? (
        <span className="grid grid-cols-3 gap-px border-t border-slate-100 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
          {products.slice(0, 3).map((product) => (
            <span key={product.id} className="bg-white p-1.5 dark:bg-slate-900">
              <span className="block aspect-square w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                {product.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={product.image_url}
                    alt={product.title}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="grid size-full place-items-center">
                    <PackageCheck className="size-5 text-slate-300 dark:text-slate-600" strokeWidth={1} />
                  </span>
                )}
              </span>
              <span className="mt-1 block truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">
                {formatPKR(product.price)}
              </span>
            </span>
          ))}
        </span>
      ) : (
        <span className="border-t border-slate-100 px-4 py-3 text-xs italic text-slate-400 dark:border-slate-800 dark:text-slate-500">
          Arriving soon…
        </span>
      )}
    </Link>
  );
}

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categoryRows } = await supabase.from("categories").select("*").order("name");
  const categories = (categoryRows ?? []) as Category[];

  // For every category, pull up to 3 representative products (real photos +
  // PKR prices) alongside an EXACT product count. The count runs head-only so
  // no rows are transferred. Products tag their category by NAME
  // (case-insensitive) with a slug fallback for older rows.
  const cards = await Promise.all(
    categories.map(async (category, index) => {
      const [primary, primaryCount] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .ilike("category", category.name)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .ilike("category", category.name),
      ]);

      let products = (primary.data ?? []) as Product[];
      let totalProducts = primaryCount.count ?? 0;

      if (!primary.error && products.length === 0 && totalProducts === 0) {
        // Slug fallback for legacy rows.
        const [bySlug, slugCount] = await Promise.all([
          supabase
            .from("products")
            .select("*")
            .eq("category", category.slug)
            .order("created_at", { ascending: false })
            .limit(3),
          supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("category", category.slug),
        ]);
        products = (bySlug.data ?? []) as Product[];
        totalProducts = slugCount.count ?? 0;
      }

      if (primary.error || primaryCount.error) {
        console.error(`Failed to load products for category "${category.slug}".`);
      }

      return { category, products, totalProducts, index };
    }),
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-400">
          Browse by category
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          Shop by category.
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
          Every category at VEXIS pk with live products straight from the store —
          real images, real prices, delivered across Pakistan.
        </p>

        {categories.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <PackageCheck className="mx-auto size-12 text-slate-300 dark:text-slate-600" strokeWidth={1} />
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">No categories yet</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Categories are being curated — check back soon.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map(({ category, products, totalProducts, index }) => (
              <CategoryCard
                key={category.id}
                category={category}
                products={products}
                totalProducts={totalProducts}
                fallbackIcon={FALLBACK_ICONS[index % FALLBACK_ICONS.length]}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}