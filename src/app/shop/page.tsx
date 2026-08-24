import Link from "next/link";
import type { Metadata } from "next";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { InfiniteProductGrid } from "@/components/products/InfiniteProductGrid";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop — VEXIS pk",
};

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: categoryRows } = await supabase.from("categories").select("*").order("name");
  const categories = (categoryRows ?? []) as Category[];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-400">
          The collection
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          Shop all products.
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
          Every piece currently stocked at VEXIS pk — authentic, priced in PKR,
          and shipped across Pakistan.
        </p>

        {/* Category quick-filters */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">
            All products
          </span>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold capitalize text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
            >
              {category.name}
            </Link>
          ))}
        </div>

        <section className="mt-10">
          <InfiniteProductGrid initialLimit={12} />
        </section>
      </main>
      <Footer />
    </div>
  );
}