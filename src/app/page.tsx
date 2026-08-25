import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Footprints, Gem, PackageCheck, Sparkles, Watch } from "lucide-react";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { InfiniteProductGrid } from "@/components/products/InfiniteProductGrid";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VEXIS pk — Authentic Watches, Perfumes & Footwear in Pakistan",
  description:
    "Shop authentic watches, custom-packaged perfumes, and premium footwear at VEXIS pk — Pakistan's premier e-commerce destination for genuine timepieces, quality fragrances, and premium shoes with nationwide delivery.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VEXIS pk — Authentic Watches, Perfumes & Footwear in Pakistan",
    description:
      "Discover authentic watches, custom-packaged perfumes, and premium footwear. VEXIS pk is Pakistan's premier e-commerce store for exclusive collections, guaranteed quality, and nationwide delivery.",
    type: "website",
    siteName: "VEXIS pk",
    locale: "en_PK",
  },
};

const categoryStyles = [
  { icon: Watch, gradient: "from-emerald-50 to-teal-100 dark:from-emerald-950/60 dark:to-teal-950/60" },
  { icon: Sparkles, gradient: "from-amber-50 to-orange-100 dark:from-amber-950/60 dark:to-orange-950/60" },
  { icon: Footprints, gradient: "from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900" },
] as const;

export default async function Home() {
  const supabase = await createClient();

  // Real data from Supabase: categories for the cards, page 0 of the product
  // feed is server-rendered so the home page always shows live inventory.
  const [{ data: categoryRows }, { data: productRows }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase.from("products").select("*").order("created_at", { ascending: false }).limit(8),
  ]);

  const categories = (categoryRows ?? []) as Category[];
  const initialProducts = (productRows ?? []) as Product[];
  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-950">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 sm:px-6 md:min-h-[560px] md:grid-cols-2 lg:px-8">
            <div className="relative z-10">
              <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-400">
                <Gem className="size-4" />
                Premium essentials · Pakistan
              </p>
              <h1 className="max-w-xl text-5xl font-black tracking-tight text-slate-900 sm:text-6xl lg:text-7xl dark:text-white">
                Watches, scents &amp; <span className="text-emerald-700 dark:text-emerald-400">footwear.</span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-slate-500 dark:text-slate-400">
                Shop authentic watches, perfumes, and shoes from our live collection — delivered across Pakistan.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#featured"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800"
                >
                  Shop now <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="#categories"
                  className="rounded-lg border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
                >
                  Explore categories
                </Link>
              </div>
            </div>
            {/* Mobile-only live categories — replaces the hero graphic. A compact
                3-column grid fed from the same Supabase categories query, so any
                category added via the admin dashboard appears here instantly. The
                categories schema has no image column, so each box shows a clean
                icon (cycling on index) as the visual fallback. */}
            <div className="mt-2 md:hidden">
              {categories.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Categories are being curated — check back soon.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((category, index) => {
                    const style = categoryStyles[index % categoryStyles.length];
                    const Icon = style.icon;
                    return (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className={`group flex flex-col items-center gap-2 rounded-xl bg-gradient-to-br ${style.gradient} px-2 py-4 transition active:scale-[0.98]`}
                      >
                        <span className="grid size-11 place-items-center rounded-full bg-white/80 text-emerald-700 shadow-sm dark:bg-slate-900/70 dark:text-emerald-300">
                          <Icon className="size-5" strokeWidth={1.6} />
                        </span>
                        <span className="max-w-full truncate text-xs font-semibold text-slate-900 dark:text-white">
                          {category.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
{/* Desktop-only hero graphic (hidden on mobile — the compact
                categories grid above takes its place). */}
            <div className="relative mx-auto hidden aspect-square w-full max-w-md md:block">
              <div className="absolute inset-8 rotate-6 rounded-[2rem] bg-gradient-to-br from-emerald-800 via-teal-700 to-emerald-400 shadow-2xl shadow-emerald-900/25" />
              <div className="absolute inset-16 -rotate-6 rounded-[2rem] border border-white/30 bg-white/10 backdrop-blur-sm" />
              <div className="absolute inset-0 grid place-items-center">
                <Watch className="size-32 text-white/90 drop-shadow-2xl" strokeWidth={1} />
              </div>
              <div className="absolute bottom-3 left-3 rounded-xl bg-white px-4 py-3 shadow-xl dark:bg-slate-900">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Watches · Perfumes · Shoes</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">Live collection</p>
              </div>
            </div>
          </div>
        </section>

        {/* Product-first mobile flow: the live product grid sits directly
            after the hero (ideally above the fold) so shoppers see stock
            immediately, while categories stay below for deeper browsing. */}
        <section id="featured" className="bg-white py-14 dark:bg-slate-900/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">Fresh arrivals</p>
                <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Featured products.</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">Live inventory</span>
            </div>
            <div className="mt-7">
              <InfiniteProductGrid initialLimit={8} />
            </div>
          </div>
        </section>

        <section id="categories" className="mx-auto hidden max-w-7xl px-4 py-14 sm:px-6 md:block lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">Shop by category</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Find your signature.</h2>
            </div>
            <Link href="#featured" className="hidden text-sm font-bold text-emerald-700 sm:block dark:text-emerald-400">
              View all <ArrowRight className="ml-1 inline size-4" />
            </Link>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Categories are being curated — check back soon.</p>
            ) : (
              categories.map((category, index) => {
                const style = categoryStyles[index % categoryStyles.length];
                const Icon = style.icon;
                return (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className={`group rounded-2xl bg-gradient-to-br ${style.gradient} p-6 transition hover:-translate-y-1 hover:shadow-lg`}
                  >
                    <Icon className="size-8 text-slate-700 transition group-hover:text-emerald-700 dark:text-slate-300" strokeWidth={1.5} />
                    <h3 className="mt-16 text-xl font-black text-slate-900 dark:text-white">{category.name}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Shop the {category.name.toLowerCase()} collection.</p>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section className="border-y border-emerald-100 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
            <div>
              <PackageCheck className="size-5 text-emerald-700 dark:text-emerald-400" />
              <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Authentic quality</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Selected with care.</p>
            </div>
            <div>
              <PackageCheck className="size-5 text-emerald-700 dark:text-emerald-400" />
              <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Delivery across Pakistan</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your order, on its way.</p>
            </div>
            <div>
              <Sparkles className="size-5 text-emerald-700 dark:text-emerald-400" />
              <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Easy support</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">We are here to help.</p>
            </div>
          </div>
        </section>
      </main>
      {/* Hide the heavy main footer on mobile home so the product feed stays
          uninterrupted — the fixed bottom navigation bar handles mobile nav. */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </>
  );
}
