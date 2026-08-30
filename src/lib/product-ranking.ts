/**
 * Shared search utilities — pure functions usable from server actions,
 * server components and client components alike.
 */

export const MIN_QUERY_LENGTH = 1;
export const SUGGESTION_LIMIT = 6;
export const SEARCH_RESULTS_LIMIT = 60;

/** Nil UUID used as an impossible filter when no query is present. */
export const NIL_UUID = "00000000-0000-0000-0000-000000000000";

export interface RankableProduct {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  created_at: string;
}

/**
 * Strip characters that would break PostgREST `.or()` ilike filters or act as
 * wildcards, collapse whitespace and cap length so queries stay fast.
 */
export function sanitizeQuery(raw: string): string {
  return (raw ?? "")
    .replace(/['"\\%_(),+]/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 60);
}

export const buildIlikePattern = (query: string) => `%${query}%`;

/** How strongly a product matches the query (title beats description). */
function relevanceScore(
  title: string,
  description: string | null | undefined,
  q: string,
): number {
  const t = title.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(` ${q}`)) return 60;
  if (t.includes(q)) return 40;
  if ((description ?? "").toLowerCase().includes(q)) return 20;
  return 0;
}

/**
 * E-commerce-style ranking:
 *   relevance   — exact > prefix > word-boundary > substring > description
 *   popularity  — ×3 per lifetime unit sold (top-selling rises fast)
 *   recency     — up to +5, fading linearly over the newest 30 days
 *
 * Newest arrivals therefore outrank stale stock at equal sales, matching
 * standard storefront algorithms.
 */
export function rankProducts<T extends RankableProduct>(
  products: T[],
  query: string,
  salesById: Map<string, number>,
): T[] {
  const q = query.toLowerCase();
  const now = Date.now();

  return products
    .map((product) => {
      const relevance = relevanceScore(product.title, product.description ?? null, q);
      const sales = salesById.get(product.id) ?? 0;
      const ageDays = Math.max(
        0,
        (now - new Date(product.created_at).getTime()) / 86_400_000,
      );
      const recencyBoost = Math.max(0, 1 - ageDays / 30) * 5;
      return { product, score: relevance + sales * 3 + recencyBoost };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product);
}