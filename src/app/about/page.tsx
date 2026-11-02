import Link from "next/link";
import type { Metadata } from "next";
import { Footprints, Gem, PackageCheck, Sparkles, Watch } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "About NBS-pk — New Brand Shoes Multan | Pure Leather Since 2015",
  description:
    "NBS-pk (New Brand Shoes Multan) crafts pure, premium leather shoes entirely in-house since 2015. Discover handcrafted leather footwear backed by superior craftsmanship, honest pricing, and nationwide delivery across Pakistan.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About NBS-pk — New Brand Shoes Multan | Pure Leather Since 2015",
    description:
      "Explore NBS-pk's pure leather shoe collections: handcrafted footwear made entirely in Multan since 2015. Brand-grade quality with trusted nationwide delivery across Pakistan.",
    type: "website",
    siteName: "NBS-pk",
    locale: "en_PK",
  },
};

const collections = [
  {
    icon: Footprints,
    title: "Handcrafted leather shoes",
    body: "Pure leather footwear made entirely in our Multan workshop since 2015 — from everyday wear to formal occasions.",
  },
  {
    icon: Sparkles,
    title: "Premium quality materials",
    body: "Top-tier genuine leather and superior craftsmanship ensure every pair delivers unmatched durability and elegance.",
  },
  {
    icon: PackageCheck,
    title: "Nationwide delivery",
    body: "Tracked shipping to every corner of Pakistan, careful gift-ready packaging, and support that answers Mon–Sat, 10am–6pm.",
  },
];

const values = [
  {
    icon: Gem,
    title: "Pure leather quality",
    body: "We use only genuine, premium leather — no synthetic substitutes. Every shoe is built for longevity.",
  },
  {
    icon: Sparkles,
    title: "In-house manufacturing",
    body: "Entirely produced in our own Multan workshop since 2015 — full control from design to final stitch.",
  },
  {
    icon: PackageCheck,
    title: "Cash on Delivery",
    body: "Pay in cash when your order arrives. COD available across all cities in Pakistan.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main>
        <section className="bg-slate-50 dark:bg-slate-900">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-400">
              About NBS-pk
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-slate-900 dark:text-white sm:text-5xl">
              Crafting Excellence Since 2015
            </h1>
            <p className="mt-6 text-base leading-7 text-slate-500 dark:text-slate-400">
              New Brand Shoes Multan (NBS) has been crafting excellence since
              2015. We take pride in manufacturing pure, premium leather shoes
              and footwear entirely in-house under our own brand name. While our
              pricing reflects superior craftsmanship and top-tier materials, our
              unmatched quality ensures lifelong durability and elegance.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-500 dark:text-slate-400">
              Every pair is handcrafted in our own workshop in Multan using
              genuine leather and time-honored techniques. From design to final
              stitch, we control every step of production — ensuring quality you
              can feel and durability that lasts a lifetime.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-400">
            Our collections
          </p>
          <h2 className="mt-3 font-serif text-2xl text-slate-900 dark:text-white sm:text-3xl">
            Curated for how Pakistan lives today.
          </h2>
          <div className="mt-7 grid gap-6 sm:grid-cols-3">
            {collections.map(({ icon: Icon, title, body }) => (
              <Link
                key={title}
                href="/shop"
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <Icon className="size-7 text-amber-700 dark:text-amber-400" strokeWidth={1.5} />
                <h3 className="mt-4 text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{body}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            {values.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <Icon className="size-7 text-amber-700 dark:text-amber-400" strokeWidth={1.5} />
                <h2 className="mt-4 text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 border-t border-slate-200 pt-10 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Watch className="size-5 text-amber-700 dark:text-amber-400" />
              <Sparkles className="size-5 text-amber-700 dark:text-amber-400" />
            </div>
            <h2 className="mt-4 font-serif text-2xl text-slate-900 dark:text-white">
              What&apos;s next?
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              We add new pieces to the edit every week. Browse the live collection —
              if something speaks to you, it ships within 48 hours.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center rounded-lg bg-amber-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-800"
            >
              Browse the shop
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}