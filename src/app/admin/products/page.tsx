import { AddProductForm } from "@/components/admin/AddProductForm";
import { ProductList } from "@/components/admin/ProductList";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const supabase = await createClient();
  const [{ data: productData }, { data: categoryData }] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("name"),
  ]);
  const products = (productData ?? []) as Product[];
  const categories = (categoryData ?? []) as Category[];
  return <main className="min-h-screen bg-[#f1efe9] px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-14 dark:bg-slate-950"><div className="mx-auto max-w-[1500px]"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b58a3a]">Catalogue</p><h1 className="mt-3 font-serif text-4xl sm:text-5xl">Products</h1><div className="mt-10 grid gap-8 xl:grid-cols-[340px_1fr]"><section className="bg-[#172a2a] p-6 text-white"><h2 className="mb-6 text-sm font-semibold uppercase tracking-widest">Add product</h2><AddProductForm categories={categories} /></section><section><div className="mb-4 flex justify-between"><h2 className="text-sm font-semibold uppercase tracking-widest">Inventory</h2><span className="text-xs text-black/40 dark:text-slate-500">{products.length} products</span></div><ProductList products={products} categories={categories} /></section></div></div></main>;
}
