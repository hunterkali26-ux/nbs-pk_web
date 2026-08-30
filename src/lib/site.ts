/**
 * Canonical public origin of the store.
 *
 * Single source of truth for every absolute URL the app emits (SEO metadata,
 * sitemap/robots, admin notification emails, …).
 *
 * Resolution order:
 *   1. `NEXT_PUBLIC_SITE_URL`  — set per-environment (Vercel dashboard / .env.local)
 *   2. `https://vexis-pk.vercel.app` — the production deployment domain
 *
 * A trailing slash is stripped so callers can safely append `/path` segments.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const url = raw && raw.length > 0 ? raw : "https://vexis-pk.vercel.app";
  return url.replace(/\/+$/, "");
}