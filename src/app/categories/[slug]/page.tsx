import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CategoryPills } from "@/components/products/CategoryPills";
import { ClientProductGrid } from "@/components/products/ClientProductGrid";
import type { Category, Product } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch all categories for the navigation pills
  const { data: categoryRows } = await supabase.from("categories").select("*").order("name");
  const categories = (categoryRows ?? []) as Category[];

  // Fetch the active category
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  const cat = category as Category | null;
  if (!cat) notFound();

  // Fetch products — match by name (case-insensitive) with slug fallback
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .ilike("category", cat.name)
    .order("created_at", { ascending: false });

  let list = (products ?? []) as Product[];

  if (productsError) {
    console.error(`Failed to load products for category "${cat.slug}":`, productsError.message);
  }

  if (!productsError && list.length === 0) {
    const { data: bySlug } = await supabase
      .from("products")
      .select("*")
      .eq("category", cat.slug)
      .order("created_at", { ascending: false });
    list = (bySlug ?? []) as Product[];
  }

  // Derive subcategories from the category's `fields` array if present
  const subcategories = cat.fields && cat.fields.length > 0 ? cat.fields : undefined;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          <Link href="/" className="text-slate-400 transition hover:text-emerald-600 dark:hover:text-emerald-400">
            Home
          </Link>
          <ChevronRight className="size-3.5 text-slate-300 dark:text-slate-600" />
          <Link href="/categories" className="text-slate-400 transition hover:text-emerald-600 dark:hover:text-emerald-400">
            Categories
          </Link>
          <ChevronRight className="size-3.5 text-slate-300 dark:text-slate-600" />
          <span className="font-semibold capitalize text-slate-900 dark:text-white">{cat.name}</span>
        </nav>

        {/* Category Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {cat.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {list.length} {list.length === 1 ? "product" : "products"} available
          </p>
        </div>

        {/* Sticky Category Navigation */}
        <div className="sticky top-16 z-30 -mx-4 bg-slate-50/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:bg-slate-950/95">
          <CategoryPills categories={categories} activeSlug={slug} subcategories={subcategories} />
        </div>

        {/* Product Grid with Filters */}
        <div className="mt-6">
          <ClientProductGrid products={list} categoryName={cat.name} />
        </div>
      </main>
      <Footer />
    </div>
  );
}