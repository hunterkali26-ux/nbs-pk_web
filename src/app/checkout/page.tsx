"use client";

import Link from "next/link";
import { useEffect, useActionState, useRef, useState, type ChangeEvent } from "react";
import { Info, LockKeyhole, PackageCheck } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/lib/cart-context";
import { placeOrder } from "@/app/checkout/actions";
import { createClient } from "@/lib/supabase/client";

const inputClass = "mt-2 w-full border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const labelClass = "block text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-300";

const SHIPPING_KEY = "vexis-checkout-shipping";

type Shipping = {
  full_name: string;
  address_line_1: string;
  city: string;
  postal_code: string;
  phone: string;
  near_landmark: string;
};

const emptyShipping: Shipping = {
  full_name: "",
  address_line_1: "",
  city: "",
  postal_code: "",
  phone: "",
  near_landmark: "",
};

export default function CheckoutPage() {
  const { items, clearCart, total, count } = useCart();
  const [state, action, pending] = useActionState(placeOrder, {});
  const [authStatus, setAuthStatus] = useState<"checking" | "guest" | "signed-in">("checking");
  const [shipping, setShipping] = useState<Shipping>(emptyShipping);

  const placedOrderId = state.orderId;

  // Restore any shipping details typed before an auth detour, so nothing is
  // lost when the customer returns from /login?redirect=/checkout.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SHIPPING_KEY);
      if (saved) {
        setShipping((prev) => ({ ...prev, ...(JSON.parse(saved) as Partial<Shipping>) }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Track auth state and prefill from the profile once signed in.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setAuthStatus(user ? "signed-in" : "guest");
      if (!user) return;
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("full_name, phone_number, address")
        .eq("id", user.id)
        .maybeSingle();
      const profile = profileRow as {
        full_name: string | null;
        phone_number: string | null;
        address: string | null;
      } | null;
      if (cancelled || !profile) return;
      setShipping((prev) => ({
        ...prev,
        full_name: prev.full_name || profile.full_name || "",
        phone: prev.phone || profile.phone_number || "",
        address_line_1:
          prev.address_line_1 || (profile.address ? String(profile.address).split("\n")[0] : ""),
      }));
    };
    void load();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Clear the cart exactly ONCE per confirmed order. The ref guard prevents
  // any re-run (strict-mode double invoke, dependency churn, retries) from
  // looping or wiping a cart again after the customer starts a new one.
  const clearedForOrderRef = useRef<string | null>(null);
  useEffect(() => {
    if (!placedOrderId || clearedForOrderRef.current === placedOrderId) return;
    clearedForOrderRef.current = placedOrderId;
    clearCart();
    try {
      sessionStorage.removeItem(SHIPPING_KEY);
    } catch {
      /* ignore */
    }
  }, [placedOrderId, clearCart]);

  const updateShipping =
    (key: keyof Shipping) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setShipping((prev) => {
        const next = { ...prev, [key]: value };
        // Persist continuously so an auth detour never loses progress.
        try {
          sessionStorage.setItem(SHIPPING_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    };

  const itemsJson = JSON.stringify(
    items.map((i) => ({ productId: i.productId, title: i.title, price: i.price, quantity: i.quantity })),
  );

  if (placedOrderId) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <PackageCheck className="mx-auto size-16 text-emerald-700" strokeWidth={1} />
          <h1 className="mt-6 text-3xl font-black text-slate-900 dark:text-white">Order placed!</h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Thank you for shopping with <span className="font-semibold">VEXIS pk</span>. Your order{" "}
            <span className="font-mono text-xs">#{placedOrderId.slice(0, 8)}</span> is confirmed and pending.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">Continue shopping</Link>
            <Link href="/account/orders" className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-200">View orders</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (authStatus === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-950">
        <div
          className="size-8 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600 dark:border-slate-700 dark:border-t-emerald-400"
          role="status"
          aria-label="Loading checkout"
        />
      </div>
    );
  }

  // Guests keep their bag: prompt for auth here, then /login?redirect=/checkout
  // returns them to this exact page with their cart and details intact.
  if (authStatus === "guest" && count > 0) {
    return (
      <>
        <Navbar />
        <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-emerald-50 dark:bg-emerald-950/60">
            <LockKeyhole className="size-6 text-emerald-700 dark:text-emerald-400" />
          </span>
          <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">Sign in to check out</h1>
          <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Your bag of {count} {count === 1 ? "item" : "items"} is saved. Sign in or create an
            account and you&apos;ll land right back here to finish your order.
          </p>
          <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
            <Link
              href="/login?redirect=%2Fcheckout"
              className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
            >
              Sign in
            </Link>
            <Link
              href="/signup?redirect=%2Fcheckout"
              className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-200"
            >
              Create account
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
            Your cart and delivery details are preserved.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Checkout</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Enter your delivery details to place your order.</p>

        {items.length === 0 && (
          <div className="mx-auto max-w-md py-16 text-center">
            <PackageCheck className="mx-auto size-12 text-slate-300 dark:text-slate-600" strokeWidth={1} />
            <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Your cart is empty</h2>
            <Link href="/" className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">Head back to the shop</Link>
          </div>
        )}

        {items.length > 0 && (
          <form action={action} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <input type="hidden" name="items" value={itemsJson} />
            <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Shipping details</h2>
              <label className={labelClass}>
                Full name
                <input name="full_name" required placeholder="Full name" value={shipping.full_name} onChange={updateShipping("full_name")} className={inputClass} />
              </label>
              <label className={labelClass}>
                Address line
                <input name="address_line_1" required placeholder="Street, building, area" value={shipping.address_line_1} onChange={updateShipping("address_line_1")} className={inputClass} />
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  City
                  <input name="city" required placeholder="Karachi" value={shipping.city} onChange={updateShipping("city")} className={inputClass} />
                </label>
                <label className={labelClass}>
                  Postal code
                  <input name="postal_code" required placeholder="75000" value={shipping.postal_code} onChange={updateShipping("postal_code")} className={inputClass} />
                </label>
              </div>
              <label className={labelClass}>
                Phone number
                <input name="phone" required type="tel" placeholder="0320 8684757" value={shipping.phone} onChange={updateShipping("phone")} className={inputClass} />
              </label>
              <label className={labelClass}>
                Near Landmark
                <input name="near_landmark" placeholder="e.g. Opposite main gate, near Madina Market" value={shipping.near_landmark} onChange={updateShipping("near_landmark")} className={inputClass} />
              </label>
              {state.error && (
                <p role="alert" className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{state.error}</p>
              )}
            </div>

            {/* Payment method — COD is the only live option today. The radio is
                disabled (non-interactive) and pre-selected so it reads clearly
                as the checkout default without inviting other methods. */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Payment method</h2>
              <label className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 dark:border-emerald-900 dark:bg-emerald-950/40">
                <input
                  type="radio"
                  name="payment_method"
                  value="cod"
                  defaultChecked
                  disabled
                  aria-label="Cash on Delivery (COD)"
                  className="mt-1 size-4 accent-emerald-700"
                />
                <span className="block text-sm">
                  <span className="block font-bold text-slate-900 dark:text-white">Cash on Delivery (COD)</span>
                  <span className="mt-0.5 block text-slate-500 dark:text-slate-400">
                    Pay in cash when your order arrives at your door.
                  </span>
                </span>
              </label>
              <p role="status" className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <Info className="mt-0.5 size-4 shrink-0" />
                <span>Online payment methods coming soon. Currently, only Cash on Delivery (COD) is available.</span>
              </p>
            </div>
            <div className="sticky top-24 h-fit rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Order summary</h3>
              <div className="mt-4 space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span className="min-w-0 truncate">{item.title} × {item.quantity}</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">PKR {item.price.toLocaleString("en-PK")}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-base dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white">Total ({count} {count === 1 ? "item" : "items"})</span>
                <span className="font-black text-emerald-700 dark:text-emerald-400">PKR {total.toLocaleString("en-PK")}</span>
              </div>
              <button type="submit" disabled={pending} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
                {pending ? "Placing order..." : "Place order"}
              </button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}