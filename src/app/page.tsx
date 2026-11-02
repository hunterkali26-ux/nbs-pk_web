import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, Footprints, Gem, PackageCheck, Sparkles, Watch } from "lucide-react";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { InfiniteProductGrid } from "@/components/products/InfiniteProductGrid";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NBS-pk — Pure Leather Shoes & Footwear in Pakistan",
  description:
    "Shop authentic pure leather shoes and footwear at NBS-pk — New Brand Shoes Multan's premier e-commerce destination for premium leather footwear with nationwide delivery.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NBS-pk — Pure Leather Shoes & Footwear in Pakistan",
    description:
      "Discover pure leather shoes, handcrafted since 2015, and premium footwear. NBS-pk is Pakistan's premier e-commerce store for exclusive leather collections, guaranteed quality, and nationwide delivery.",
    type: "website",
    siteName: "NBS-pk",
    locale: "en_PK",
  },
};

const categoryStyles = [
  { icon: Watch, gradient: "from-amber-50 to-teal-100 dark:from-amber-950/60 dark:to-teal-950/60" },
  { icon: Sparkles, gradient: "from-amber-50 to-orange-100 dark:from-amber-950/60 dark:to-orange-950/60" },
  { icon: Footprints, gradient: "from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900" },
] as const;

export default async function Home() {
  const supabase = await createClient();

  // Real data from Supabase: category cards for the hero. The product feed
  // below fetches its own pages client-side via InfiniteProductGrid.
  const { data: categoryRows } = await supabase.from("categories").select("*").order("name");

  const categories = (categoryRows ?? []) as Category[];
  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-950">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 sm:px-6 md:min-h-[560px] md:grid-cols-2 lg:px-8">
            <div className="relative z-10">
              <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-400">
                <Gem className="size-4" />
                Pure leather · Crafted since 2015 · Multan
              </p>
              <h1 className="max-w-xl text-5xl font-black tracking-tight text-slate-900 sm:text-6xl lg:text-7xl dark:text-white">
                Premium leather footwear &amp; <span className="text-amber-700 dark:text-amber-400">shoes.</span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-slate-500 dark:text-slate-400">
                Shop pure, premium leather shoes handcrafted in-house at New Brand Shoes Multan — delivered across Pakistan.
              </p>
              <div className="mt-8 flex flex-row gap-2 sm:gap-4 text-xs sm:text-sm px-3 py-2 sm:px-6 sm:py-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-700/20 hover:bg-amber-800"
                >
                  Shop Leather Shoes <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/categories"
                  className="rounded-lg border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-amber-600 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-amber-500 dark:hover:text-amber-400"
                >
                  Browse Collections
                </Link>
              </div>
            </div>
            {/* Mobile-only live categories — replaces the hero graphic. A compact
                3-column grid fed from the same Supabase categories query, so any
                category added via the admin dashboard appears here instantly.
                Cards show the uploaded cover photo on top with the name neatly
                underneath; the cycling icon is only a fallback when no photo has
                been set yet. */}
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
                        className="group overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900"
                      >
                        <span
                          className={`relative block aspect-square w-full overflow-hidden bg-gradient-to-br ${style.gradient}`}
                        >
                          {category.image_url ? (
                            <Image
                              src={category.image_url}
                              alt={category.name}
                              fill
                              sizes="(max-width: 767px) 31vw, 200px"
                              className="object-cover transition duration-300 group-hover:scale-105"
                              
                            />
                          ) : (
                            <span className="absolute inset-0 grid place-items-center">
                              <Icon className="size-7 text-amber-600/70 dark:text-amber-300/70" strokeWidth={1.5} />
                            </span>
                          )}
                        </span>
                        <span className="block truncate px-1.5 py-2 text-center text-xs font-bold capitalize text-slate-900 dark:text-white">
                          {category.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Desktop-only hero branding image (hidden on mobile & tablet — the
                compact categories grid above takes its place). */}
            <div className="relative mx-auto hidden w-full max-w-xl lg:block">
              <Image
                src="https://4upsg7iazjf61bbi.public.blob.vercel-storage.com/assets/hero-branding.png"
                alt="NBS-pk — premium watches, perfumes and footwear"
                width={1024}
                height={683}
                priority
                sizes="(min-width: 1024px) 40vw, 576px"
                className="h-auto w-full rounded-[2rem] object-cover shadow-2xl shadow-amber-900/30 ring-1 ring-slate-900/10 dark:ring-white/10"
              />
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
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">Fresh arrivals</p>
                <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Featured products.</h2>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">Live inventory</span>
            </div>
            <div className="mt-7">
              <InfiniteProductGrid initialLimit={8} />
            </div>
          </div>
        </section>

        <section id="categories" className="mx-auto hidden max-w-7xl px-4 py-14 sm:px-6 md:block lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">Shop by category</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Find your signature.</h2>
            </div>
            <Link href="#featured" className="hidden text-sm font-bold text-amber-700 sm:block dark:text-amber-400">
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
                    className="group overflow-hidden rounded-2xl border border-slate-100 bg-white transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                  >
                    <span
                      className={`relative block aspect-[4/3] w-full overflow-hidden bg-gradient-to-br ${style.gradient}`}
                    >
                      {category.image_url ? (
                        <Image
                          src={category.image_url}
                          alt={category.name}
                          fill
                          sizes="(max-width: 1023px) 45vw, 30vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="absolute inset-0 grid place-items-center">
                          <Icon className="size-10 text-amber-600/60 dark:text-amber-300/60" strokeWidth={1.25} />
                        </span>
                      )}
                    </span>
                    <span className="block p-5">
                      <span className="block text-lg font-black capitalize text-slate-900 dark:text-white">
                        {category.name}
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">
                        Shop the {category.name.toLowerCase()} collection.
                      </span>
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section className="border-y border-amber-100 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
            <div>
              <PackageCheck className="size-5 text-amber-700 dark:text-amber-400" />
              <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Pure leather quality</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Crafted in-house since 2015.</p>
            </div>
            <div>
              <PackageCheck className="size-5 text-amber-700 dark:text-amber-400" />
              <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Delivery across Pakistan</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your order, on its way.</p>
            </div>
            <div>
              <Sparkles className="size-5 text-amber-700 dark:text-amber-400" />
              <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Lifetime durability</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Built to last a lifetime.</p>
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
