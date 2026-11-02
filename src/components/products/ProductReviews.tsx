"use client";

import { LoaderCircle, Star, UserRound } from "lucide-react";
import { useActionState, useState } from "react";

import { addProductReview } from "@/app/products/actions";
import type { ProductReview } from "@/types/database";

const fieldClass =
  "mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

/** Read-only star row used inside review cards and the summary block. */
function Stars({ value, className = "size-4" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${className} ${
            star <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-slate-300 dark:text-slate-600"
          }`}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

/** Interactive picker — click to set, hover to preview. */
function RatingPicker({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="rounded p-0.5 transition active:scale-90"
        >
          <Star
            className={`size-8 transition ${
              star <= shown ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"
            }`}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({
  productId,
  reviews,
}: {
  productId: string;
  reviews: ProductReview[];
}) {
  const [state, action, pending] = useActionState(addProductReview, {});
  const [rating, setRating] = useState(0);

  const total = reviews.length;
  const average = total
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / total
    : 0;
  const distribution = [5, 4, 3, 2, 1].map((score) => ({
    score,
    count: reviews.filter((review) => review.rating === score).length,
  }));

  return (
    <section id="reviews" className="scroll-mt-24 border-t border-slate-100 pt-10 dark:border-slate-800">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
        Ratings &amp; reviews
      </p>
      <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
        What buyers are saying.
      </h2>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Summary -------------------------------------------------------- */}
        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-5xl font-black text-slate-900 dark:text-white">{average.toFixed(1)}</p>
          <Stars value={average} className="size-5" />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Based on {total} review{total === 1 ? "" : "s"}
          </p>

          <div className="mt-5 space-y-1.5">
            {distribution.map(({ score, count }) => (
              <div key={score} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-8 shrink-0">{score}★</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <span
                    className="block h-full rounded-full bg-amber-400"
                    style={{ width: `${total ? Math.round((count / total) * 100) : 0}%` }}
                  />
                </span>
                <span className="w-6 shrink-0 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* List + form ---------------------------------------------------- */}
        <div className="space-y-8">
          {total === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center dark:border-slate-700">
              <UserRound className="mx-auto size-10 text-slate-300 dark:text-slate-600" strokeWidth={1.2} />
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">No reviews yet</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Be the first to rate this product — your feedback helps other buyers.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {reviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-9 place-items-center rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                        <UserRound className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {review.author_name || "NBS-pk customer"}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {formatDate(review.created_at)}
                        </p>
                      </div>
                    </div>
                    <Stars value={review.rating} />
                  </div>
                  {review.title ? (
                    <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{review.title}</p>
                  ) : null}
                  {review.comment ? (
                    <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">{review.comment}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {/* Submit a review */}
          <form
            action={action}
            className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <input type="hidden" name="product_id" value={productId} />
            <input type="hidden" name="rating" value={rating} />

            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
              Write a review
            </h3>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Your rating
              </p>
              <div className="mt-2">
                <RatingPicker value={rating} onChange={setRating} />
              </div>
            </div>

            <label className="mt-5 block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Headline (optional)
              <input name="title" placeholder="Great quality!" maxLength={80} className={fieldClass} />
            </label>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Your review
              <textarea
                name="comment"
                required
                rows={4}
                placeholder="Tell us what you loved about this product…"
                className={`${fieldClass} resize-y`}
              />
            </label>

            {state.error ? (
              <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {state.error}
              </p>
            ) : null}
            {state.success ? (
              <p role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                {state.success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending || rating === 0}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-700 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {pending ? "Publishing…" : "Submit review"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}