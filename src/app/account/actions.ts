"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ProfileUpdateState = {
  error?: string;
  success?: boolean;
};

/**
 * Update the signed-in customer's profile row.
 *
 * Deliberately writes ONLY the editable columns (full_name, phone_number,
 * address) via `.update()` — never `updated_at`/`created_at`/`id` — so the
 * query cannot collide with a database trigger or a missing column, and
 * `revalidatePath` clears any cached render of /account afterwards.
 */
export async function updateProfile(
  _previousState: ProfileUpdateState,
  formData: FormData,
): Promise<ProfileUpdateState> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { error: "You must be signed in to update your profile." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phoneNumber = String(formData.get("phone_number") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!fullName || !phoneNumber || !address) {
    return { error: "Name, phone number, and address are all required." };
  }

  // Only touch the three editable columns — no updated_at, no upsert.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone_number: phoneNumber,
      address,
    } as never)
    .eq("id", userData.user.id);

  if (error) {
    console.error("Profile update failed:", error.message);
    return { error: "Your changes could not be saved. Please try again." };
  }

  // Keep auth metadata in sync so the navbar avatar/name stay accurate.
  await supabase.auth.updateUser({
    data: { full_name: fullName, phone_number: phoneNumber, address },
  });

  // Bust the cached /account renders so fresh data is shown immediately.
  revalidatePath("/account");
  revalidatePath("/");

  return { success: true };
}
