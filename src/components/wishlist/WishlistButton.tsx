"use client";

import { Heart } from "lucide-react";

import { useWishlist } from "@/lib/wishlist-context";

type Variant = "overlay" | "detail";

/**
 * Heart toggle shared by product cards and the detail page.
 *
 * - `overlay` floats on card imagery (callers wrap grids in <Link>; the click
 *   is stopped here so only the heart reacts).
 * - `detail` renders a labelled inline control for the buy box.
 * Guests are intercepted by the provider's sign-in modal; signed-in users get
 * an optimistic toggle persisted to Supabase.
 */
export function WishlistButton({
  productId,
  variant = "overlay",
  productTitle,
}: {
  productId: string;
  variant?: Variant;
  productTitle?: string;
}) {
  const { isWishlisted, toggle, pendingIds } = useWishlist();
  const saved = isWishlisted(productId);
  const busy = pendingIds.has(productId);

  const label = saved
    ? `Remove ${productTitle ?? "product"} from wishlist`
    : `Save ${productTitle ?? "product"} to wishlist`;

  if (variant === "detail") {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          toggle({ id: productId });
        }}
        disabled={busy}
        aria-pressed={saved}
        aria-label={label}
        title={saved ? "Saved to wishlist" : "Save to wishlist"}
        className={`inline-flex items-center justify-center gap-2 rounded-xl border-2 px-6 py-4 text-sm font-bold transition ${
          saved
            ? "border-rose-500 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/60"
            : "border-slate-300 text-slate-700 hover:border-rose-400 hover:text-rose-500 dark:border-slate-700 dark:text-slate-200 dark:hover:border-rose-500"
        } disabled:cursor-wait disabled:opacity-60`}
      >
        <Heart
          className={`size-4 transition-transform active:scale-75 ${
            saved ? "fill-current" : ""
          }`}
        />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle({ id: productId });
      }}
      disabled={busy}
      aria-pressed={saved}
      aria-label={label}
      title={saved ? "Saved to wishlist" : "Save to wishlist"}
      className={`absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full shadow-md backdrop-blur transition active:scale-90 ${
        saved
          ? "bg-white text-rose-500 dark:bg-slate-900"
          : "bg-white/95 text-slate-500 hover:text-rose-500 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:text-rose-400"
      } disabled:cursor-wait ${
        busy ? "animate-pulse" : ""
      }`}
    >
      <Heart
        className={`size-4 transition-transform ${saved ? "fill-current" : ""}`}
      />
      {/* Screen-reader status without altering visuals */}
      <span className="sr-only">{label}</span>
    </button>
  );
}
