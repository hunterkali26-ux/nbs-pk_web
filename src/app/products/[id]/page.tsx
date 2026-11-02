import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ProductDetail } from "@/components/products/ProductDetail";
import { createClient } from "@/lib/supabase/server";
import type { Product, ProductReview } from "@/types/database";

export const dynamic = "force-dynamic";

// Static metadata (no extra DB round-trip) keeps first-byte time minimal.
export const metadata: Metadata = {
  title: "Product — NBS-pk",
  description:
    "Authentic watches, perfumes and footwear with live pricing, specifications and verified buyer reviews.",
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Parallel round-trip #1: product + reviews are both keyed by id, so they
  // resolve together. Related products need the category, so they follow in
  // round #2 only when a product was actually found.
  const [{ data: productData }, { data: reviewRows }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    // Reviews are publicly readable; newest first. A missing table (migration
    // pending) degrades to an empty list rather than breaking the page.
    supabase
      .from("product_reviews")
      .select("id, product_id, user_id, author_name, rating, title, comment, created_at")
      .eq("product_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const product = (productData ?? null) as Product | null;
  if (!product) notFound();

  const reviews = (reviewRows ?? []) as ProductReview[];

  // Round #2 — same-category neighbours for the "You may also like" rail.
  const { data: relatedRows } = await supabase
    .from("products")
    .select("*")
    .eq("category", product.category)
    .neq("id", product.id)
    .limit(4);
  const related = (relatedRows ?? []) as Product[];

  return <ProductDetail product={product} reviews={reviews} related={related} />;
}