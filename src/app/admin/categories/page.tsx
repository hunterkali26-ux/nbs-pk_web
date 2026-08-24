import { CategoryManager } from "@/components/admin/CategoryManager";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("name");
  return <main className="min-h-screen bg-[#f1efe9] px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-14 dark:bg-slate-950"><div className="mx-auto max-w-[1100px]"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b58a3a]">Catalogue structure</p><h1 className="mt-3 font-serif text-4xl sm:text-5xl">Categories</h1><p className="mt-4 max-w-lg text-sm text-black/50 dark:text-slate-400">Keep the storefront edit organized and make new collections available to the product team.</p><div className="mt-10"><CategoryManager categories={(data ?? []) as Category[]} /></div></div></main>;
}
