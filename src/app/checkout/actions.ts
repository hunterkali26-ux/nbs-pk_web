"use server";

import { createClient } from "@/lib/supabase/server";
import type { Order, OrderInsert, OrderItemInsert, ShippingAddress } from "@/types/database";
import { syncCart } from "@/lib/cart-actions";
import { sendOrderNotification } from "@/lib/email";

export type CheckoutState = {
  error?: string;
  orderId?: string;
};

export interface CheckoutLine {
  productId: string;
  title: string;
  price: number;
  quantity: number;
}

export interface CheckoutInput {
  full_name: string;
  address_line_1: string;
  city: string;
  postal_code: string;
  phone: string;
  lines: CheckoutLine[];
}

export async function placeOrder(prevState: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { error: "You must be signed in to place an order." };
  }

  const full_name = String(formData.get("full_name") ?? "").trim();
  const address_line_1 = String(formData.get("address_line_1") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const postal_code = String(formData.get("postal_code") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const nearLandmark = String(formData.get("near_landmark") ?? "").trim();
  const rawLines = String(formData.get("items") ?? "");

  if (!full_name || !address_line_1 || !city || !postal_code || !phone) {
    return { error: "Complete every shipping field to place your order." };
  }

  let lines: CheckoutLine[] = [];
  try {
    lines = JSON.parse(rawLines) as CheckoutLine[];
  } catch {
    return { error: "Your cart could not be read. Please try again." };
  }

  if (!Array.isArray(lines) || lines.length === 0) {
    return { error: "Your cart is empty." };
  }

        
  
  const ids = lines.map((line) => line.productId);
  const { data: productRows } = (await supabase
    .from("products")
    .select("id, title, price")
    .in("id", ids)) as unknown as {
    data: { id: string; title: string; price: number }[] | null;
  };

  const productRowsList = (productRows ?? []) as { id: string; title: string; price: number }[];

  const priceMap = new Map<string, number>(
    productRowsList.map((p) => [p.id, Number(p.price)]),
  );

  const total_amount = lines.reduce(
    (sum, line) => sum + (priceMap.get(line.productId) ?? 0) * line.quantity,
    0,
  );

  // Live orders schema: shipping_address is a plain TEXT column (not JSON)
  // with a separate NOT NULL city column. Build a clean one-line address for
  // storage and keep the structured object for the admin email notification.
  const shippingAddressText =
    [address_line_1, postal_code, "Pakistan"].filter(Boolean).join(", ") ||
    "Address not provided";

  const shippingDetails: ShippingAddress = {
    full_name,
    address_line_1,
    city,
    postal_code,
    country: "Pakistan",
    phone,
  };

  // Every NOT NULL column on the live orders table is mapped with a fallback
  // so the insert can never violate a constraint (no more 23502 errors).
  // `status` is omitted on purpose — the DB default ('Pending') applies.
  const orderPayload: OrderInsert = {
    user_id: userData.user.id,
    customer_name: full_name || "NBS-pk Customer",
    customer_phone: phone || "00000000000",
    shipping_address: shippingAddressText,
    city: city || "Multan",
    total_amount: Number(total_amount),
    ...(nearLandmark ? { near_landmark: nearLandmark } : {}),
  };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert(orderPayload as unknown as never)
    .select("id")
    .single();

    if (orderError || !order) {
    // LOG THE FULL SUPABASE ERROR — `.message` alone is often a vague string
    // that hides the real cause (missing table, RLS violation, type mismatch).
    // This surfaces code / details / hint / message so we can see exactly why
    // the insert was rejected.
    console.error("Order insert failed:", {
      message: orderError?.message,
      code: orderError?.code,
      details: orderError?.details,
      hint: orderError?.hint,
      full: orderError,
    });
    return { error: "Your order could not be placed. Please try again." };
  }

  const items: OrderItemInsert[] = lines.map((line) => ({
    order_id: (order as Order).id,
    product_id: line.productId,
    quantity: line.quantity,
    // Live order_items schema names this column price_at_purchase.
    price_at_purchase: priceMap.get(line.productId) ?? 0,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(items as never[]);

    if (itemsError) {
    console.error("Order items insert failed:", {
      message: itemsError.message,
      code: itemsError.code,
      details: itemsError.details,
      hint: itemsError.hint,
      full: itemsError,
    });
    return { error: "Your order was placed but the items could not be recorded. Please contact support." };
  }

    // Clear the persisted cart so it disappears for the signed-in user.
  await syncCart(userData.user.id, []);

  // Best-effort admin notification. The order is already committed, so a
  // mailing failure must never roll back or block a successful purchase.
  try {
    await sendOrderNotification({
      orderId: (order as Order).id,
      total_amount,
      status: "Pending",
      shipping_address: shippingDetails,
      items: lines.map((line) => ({
        title: productRowsList.find((p) => p.id === line.productId)?.title ?? line.title,
        quantity: line.quantity,
        unit_price: priceMap.get(line.productId) ?? 0,
      })),
    });
  } catch (emailErr) {
    console.warn("Order notification email failed:", emailErr);
  }

  return { orderId: (order as Order).id };
}