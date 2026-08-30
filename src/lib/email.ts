"use server";

import { getSiteUrl } from "@/lib/site";
import type { ShippingAddress } from "@/types/database";

/**
 * One line of the order, as shown in the admin email.
 * `title` is the product name (resolved from the `products` table at order time
 * so a deleted product still shows its original name in the notification).
 */
export interface OrderNotificationItem {
  title: string;
  quantity: number;
  unit_price: number;
}

export interface OrderNotification {
  orderId: string;
  total_amount: number;
  status: string;
  shipping_address: ShippingAddress;
  items: OrderNotificationItem[];
}

/** Recipient / sender overrides via env (with safe defaults). */
const ADMIN_EMAIL = process.env.RESEND_ADMIN_TO ?? "hunterkali26@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM ?? "VEXIS pk <onboarding@resend.dev>";
const STORE_URL = getSiteUrl();

/**
 * Dispatch an order-placed notification to the store admin through Resend.
 *
 * This is strictly best-effort: it returns `false` — and never throws — when the
 * API key is missing or the request fails, so order creation is never rolled back
 * by an email failure. The order itself is already committed to the database by
 * the caller before this is even invoked.
 */
export async function sendOrderNotification(notification: OrderNotification): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[email] RESEND_API_KEY is not set — skipping admin order notification. " +
        "Add it to your environment (see .env.example) to enable live order alerts.",
    );
    return false;
  }

  const shortId = String(notification.orderId).slice(0, 8);
  const currency = "en-PK";
  const total = Number(notification.total_amount);

  const { full_name, phone, address_line_1, city, postal_code, country } =
    notification.shipping_address;

  const textLines = notification.items.map(
    (item) =>
      `* ${item.title} × ${item.quantity} @ PKR ${item.unit_price.toLocaleString(currency)}`,
  );

  const text = [
    `New VEXIS pk order #${shortId} — ${notification.status}`,
    "",
    "Customer:",
    full_name,
    `Phone: ${phone ?? "—"}`,
    `Address: ${address_line_1}, ${city} ${postal_code}, ${country ?? "Pakistan"}`,
    "",
    "Items:",
    ...textLines,
    "",
    `Total: PKR ${total.toLocaleString(currency)}`,
    "",
    `View in admin: ${STORE_URL}/admin/orders`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui, sans-serif; line-height:1.5">
      <h2 style="margin:.5rem 0">New VEXIS pk order #${shortId}</h2>
      <p style="margin:.25rem 0"><strong>Status:</strong> ${notification.status}</p>
      <p style="margin:.25rem 0"><strong>Customer:</strong> ${full_name}</p>
      <p style="margin:.25rem 0"><strong>Phone:</strong> ${phone ?? "—"}</p>
      <p style="margin:.25rem 0"><strong>Address:</strong> ${address_line_1}, ${city} ${postal_code}, ${country ?? "Pakistan"}</p>
      <h3 style="margin:1rem 0 .5rem">Items</h3>
      <ul style="margin:.25rem 0; padding-left:1.125rem">
        ${notification.items
          .map(
            (item) =>
              `<li>${item.title} × ${item.quantity} — PKR ${item.unit_price.toLocaleString(currency)}</li>`,
          )
          .join("")}
      </ul>
      <p style="margin:.75rem 0"><strong>Total:</strong> PKR ${total.toLocaleString(currency)}</p>
      <p style="margin:.25rem 0; color:#666; font-size:.875rem">
        <a href="${STORE_URL}/admin/orders">Open in admin →</a>
      </p>
    </div>
  `;

  try {
    // Abort if Resend is slow/unreachable so the checkout response is never hung.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `New VEXIS pk order #${shortId} — PKR ${total.toLocaleString(currency)}`,
        text,
        html,
      }),
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[email] Resend API error:", res.status, body);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[email] sendOrderNotification threw:", err);
    return false;
  }
}