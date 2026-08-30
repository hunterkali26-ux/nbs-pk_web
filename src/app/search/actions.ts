"use server";

import { createClient } from "@/lib/supabase/server";
import {
  MIN_QUERY_LENGTH,
  SUGGESTION_LIMIT,
  buildIlikePattern,
  rankProducts,
  sanitizeQuery,
} from "@/lib/product-ranking";

export interface SearchSuggestion {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
}

export interface SuggestionResult {
  products: SearchSuggestion[];
}

/**
 * Live suggestion lookup powering the header search dropdown. Public/anon-safe
 * and deliberately lightweight: one indexed ilike pass over titles +
 * descriptions, relevance/recency ranked in memory (lifetime-sales weighting
 * is reserved for the full /search results page to keep keystroke latency low).
 */
export async function fetchSuggestions(rawQuery: string): Promise<SuggestionResult> {
  const query = sanitizeQuery(rawQuery ?? "");
  if (query.length < MIN_QUERY_LENGTH) return { products: [] };

  const supabase = await createClient();
  const pattern = buildIlikePattern(query);

  // Over-fetch so relevance + recency ranking has room to reorder.
  const { data, error } = await supabase
    .from("products")
    .select("id, title, price, image_url, created_at")
    .or(`title.ilike.${pattern},description.ilike.${pattern}`)
    .order("created_at", { ascending: false })
    .limit(SUGGESTION_LIMIT * 4);

  if (error) {
    console.error("Search suggestions failed:", error.message);
    return { products: [] };
  }

  const rows = (data ?? []) as unknown as (SearchSuggestion & { created_at: string })[];
  const ranked = rankProducts(rows, query, new Map());

  return {
    products: ranked.slice(0, SUGGESTION_LIMIT).map((product) => ({
      id: product.id,
      title: product.title,
      price: product.price,
      image_url: product.image_url,
    })),
  };
}