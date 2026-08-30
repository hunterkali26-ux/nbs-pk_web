"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { ProductReviewInsert } from "@/types/database";

export type ReviewActionState = {
  error?: string;
  success?: string;
};

const formValue = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

/**
 * Publish a star rating + review for a product. Any signed-in user may review;
 * the author name is snapshotted from their profile at insert time so the
 * storefront never needs to join into RLS-protected profiles.
 */
export async function addProductReview(
  _previousState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in to submit a review." };
  }

  const productId = formValue(formData, "product_id");
  const rating = Number(formData.get("rating"));
  const title = formValue(formData, "title");
  const comment = formValue(formData, "comment");

  if (!productId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Choose a star rating to continue." };
  }

  if (!comment) {
    return { error: "Write a short review before submitting." };
  }

  // Best-effort profile lookup for the display name; falls back to a generic
  // label so a missing/RLS-denied profile row never blocks a review.
  let authorName: string | null = null;
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  authorName =
    (profileRow as { full_name: string | null } | null)?.full_name ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null) ||
    "VEXIS pk buyer";

  const payload: ProductReviewInsert = {
    product_id: productId,
    user_id: user.id,
    author_name: authorName,
    rating,
    title: title || null,
    comment,
  };

  const { error } = await supabase
    .from("product_reviews")
    .insert(payload as never);

  if (error) {
    console.error("Review insert failed:", error);
    return { error: "Your review could not be posted. Please try again." };
  }

  revalidatePath(`/products/${productId}`);
  revalidatePath("/products");
  return { success: "Thanks! Your review has been published." };
}