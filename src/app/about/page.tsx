import Link from "next/link";
import type { Metadata } from "next";
import { Footprints, Gem, PackageCheck, Sparkles, Watch } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "About VEXIS pk — Exclusive Curated Collections in Pakistan",
  description:
    "VEXIS pk is Pakistan's premier curated e-commerce store for authentic watches, custom-packaged fragrances, and premium footwear. Discover exclusive collections backed by guaranteed quality, honest PKR pricing, and nationwide delivery.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About VEXIS pk — Exclusive Curated E-Commerce Collections",
    description:
      "Explore VEXIS pk's exclusive curated collections: authentic watches, custom-packaged fragrances, and premium footwear. Brand-grade quality with trusted nationwide delivery across Pakistan.",
    type: "website",
    siteName: "VEXIS pk",
    locale: "en_PK",
  },
};

const collections = [
  {
    icon: Watch,
    title: "Authentic watches",
    body: "Genuine timepieces sourced from trusted suppliers and inspected for authenticity before they ever reach your doorstep.",
  },
  {
    icon: Sparkles,
    title: "Custom-packaged fragrances",
    body: "Signature and designer scents, re-crafted with care and shipped in premium custom packaging that protects the bottle to the last spray.",
  },
  {
    icon: Footprints,
    title: "Premium footwear",
    body: "Style-first shoes selected for comfort and built to last — from everyday sneakers to polished formal wear.",
  },
];

const values = [
  {
    icon: Gem,
    title: "Authenticity, guaranteed",
    body: "Every timepiece, fragrance, and pair is sourced from trusted suppliers and inspected before it ever reaches our shelves.",
  },
  {
    icon: Sparkles,
    title: "Considered curation",
    body: "We keep the catalogue small on purpose — an exclusive edit of pieces our team actually wears and recommends.",
  },
  {
    icon: PackageCheck,
    title: "Nationwide delivery",
    body: "Tracked shipping to every corner of Pakistan, careful gift-ready packaging, and support that answers Mon–Sat, 10am–6pm.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main>
        <section className="bg-slate-50 dark:bg-slate-900">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-400">
              About VEXIS pk
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-slate-900 dark:text-white sm:text-5xl">
              Everyday luxury, made simple.
            </h1>
            <p className="mt-6 text-base leading-7 text-slate-500 dark:text-slate-400">
              VEXIS pk is Pakistan&apos;s premier e-commerce destination for
              exclusive, curated collections — authentic watches, custom-packaged
              fragrances, and premium footwear. Every piece is hand-selected by
              our team from trusted suppliers, inspected for quality, and priced
              honestly in PKR.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-500 dark:text-slate-400">
              We built the store we wanted to shop from: a tight, verified edit
              with brand-grade quality — delivered to every corner of Pakistan
              with tracking, secure checkout, and support that has your back.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-400">
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
                <Icon className="size-7 text-emerald-700 dark:text-emerald-400" strokeWidth={1.5} />
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
                <Icon className="size-7 text-emerald-700 dark:text-emerald-400" strokeWidth={1.5} />
                <h2 className="mt-4 text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 border-t border-slate-200 pt-10 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Watch className="size-5 text-emerald-700 dark:text-emerald-400" />
              <Sparkles className="size-5 text-emerald-700 dark:text-emerald-400" />
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
              className="mt-6 inline-flex items-center rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
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