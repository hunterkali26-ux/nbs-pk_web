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

export type OrderEditState = {
  error?: string;
  success?: string;
};

// Support line surfaced to customers when an order is no longer editable.
// NOTE: intentionally NOT exported — "use server" modules may only export
// async functions, and a value export invalidates the entire module.
const ORDER_SUPPORT_LINE = "0320 8684757";

/**
 * Customer-side edit of their OWN order's delivery details. The strict
 * "status must be pending" rule is enforced here from the DATABASE value
 * (not a client prop), mirroring the RLS UPDATE policy in
 * supabase/migrations/0002_order_edit_policies.sql.
 *
 * Only delivery-detail columns are written — never status, totals, updated_at.
 */
export async function updateMyOrderDetails(
  _previousState: OrderEditState,
  formData: FormData,
): Promise<OrderEditState> {
  const orderId = String(formData.get("order_id") ?? "").trim();
  const customerName = String(formData.get("customer_name") ?? "").trim();
  const customerPhone = String(formData.get("customer_phone") ?? "").trim();
  const shippingAddress = String(formData.get("shipping_address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const nearLandmark = String(formData.get("near_landmark") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!orderId) return { error: "Order not found." };
  if (!customerName || !customerPhone || !shippingAddress || !city) {
    return { error: "Full name, phone, address and city are required." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: "Your session expired — please sign in again." };
  }

  // Authoritative status/ownership check straight from the database.
  const { data: row, error: fetchError } = await supabase
    .from("orders")
    .select("user_id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError || !row) {
    return { error: "We could not find that order." };
  }
  const current = row as { user_id: string; status: string };
  if (current.user_id !== userData.user.id) {
    return { error: "That order does not belong to your account." };
  }
  if (String(current.status).toLowerCase() !== "pending") {
    return {
      error: `This order is already ${String(
        current.status,
      ).toLowerCase()} — edits are locked. If you need to change your details, please contact us at ${ORDER_SUPPORT_LINE}`,
    };
  }

  const payload = {
    customer_name: customerName,
    customer_phone: customerPhone,
    shipping_address: shippingAddress,
    city,
    ...(nearLandmark ? { near_landmark: nearLandmark } : {}),
    ...(notes ? { notes } : {}),
  };

  try {
    const { error } = await supabase
      .from("orders")
      .update(payload as never)
      .eq("id", orderId)
      .eq("user_id", userData.user.id);

    if (error) {
      console.error("Customer order edit failed:", error);
      return { error: "Your changes could not be saved right now." };
    }

    revalidatePath("/account/orders");
    revalidatePath("/admin/orders");
    return { success: "Delivery details updated." };
  } catch {
    return { error: "Something went wrong while saving your details." };
  }
}

