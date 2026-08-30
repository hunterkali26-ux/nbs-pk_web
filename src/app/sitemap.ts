import type { MetadataRoute } from "next";

import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";

// The Supabase server client reads auth cookies, so this route is dynamic by
// nature. Declare it explicitly to skip the (failing) static prerender pass.
export const dynamic = "force-dynamic";

/**
 * Dynamic sitemap.xml generation.
 *
 * Static marketing/shop routes are always included. Product and category URLs
 * are pulled from Supabase at request time — but a database failure is handled
 * gracefully: the sitemap degrades to the static routes instead of throwing,
 * so a Supabase outage can never break the /sitemap.xml endpoint.
 *
 * Dynamic entries use `lastModified` from the row's `updated_at`/`created_at`
 * so search engines can skip re-crawling unchanged content.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
  ];

  let supabase;
  try {
    supabase = await createClient();
  } catch (error) {
    console.error("[sitemap] Supabase client unavailable:", error);
    return staticEntries;
  }

  const [productResult, categoryResult] = await Promise.all([
    supabase.from("products").select("id, created_at").order("created_at", { ascending: false }),
    supabase.from("categories").select("slug, created_at").order("name"),
  ]);

  if (productResult.error) {
    console.error("[sitemap] Failed to list products:", productResult.error.message);
  }
  if (categoryResult.error) {
    console.error("[sitemap] Failed to list categories:", categoryResult.error.message);
  }

  // The typed client's select inference resolves these projections to `never`
  // in this context, so the rows are narrowed defensively through an explicit
  // shape instead of relying on the generic.
  type ProductRow = { id?: unknown; created_at?: unknown };
  type CategoryRow = { slug?: unknown; created_at?: unknown };

  const lastModifiedOf = (raw: unknown): Date | undefined => {
    if (typeof raw !== "string" || raw.length === 0) return undefined;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? undefined : date;
  };

  const productEntries: MetadataRoute.Sitemap = ((productResult.data ?? []) as ProductRow[])
    .filter((row): row is { id: string; created_at?: unknown } => typeof row.id === "string")
    .map((row) => ({
      url: `${siteUrl}/products/${row.id}`,
      lastModified: lastModifiedOf(row.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  const categoryEntries: MetadataRoute.Sitemap = ((categoryResult.data ?? []) as CategoryRow[])
    .filter((row): row is { slug: string; created_at?: unknown } => typeof row.slug === "string")
    .map((row) => ({
      url: `${siteUrl}/categories/${encodeURIComponent(row.slug)}`,
      lastModified: lastModifiedOf(row.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}