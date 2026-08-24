"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, PackageOpen, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";

export default function CartPage() {
  const { items, addItem, removeItem, updateQuantity, total, count } = useCart();
  const router = useRouter();
  const [pendingAuth, setPendingAuth] = useState(false);

  // Guests are bounced to sign-in with a return trip to /checkout; the guest
  // cart survives in localStorage and merges into their account on sign-in.
  const handleProceedToCheckout = async () => {
    setPendingAuth(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    router.push(user ? "/checkout" : `/login?redirect=${encodeURIComponent("/checkout")}`);
  };

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
          <PackageOpen className="size-16 text-slate-300 dark:text-slate-700" strokeWidth={1} />
          <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-slate-100">Your cart is empty</h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Looks like you haven&apos;t added anything to your cart yet. Browse our collection and find your next essential.
          </p>
          <Link
            href="/#featured"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
          >
            <ShoppingBag className="size-4" />
            Shop VEXIS pk
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Review your items</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">Shopping bag</h1>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-4 px-4 py-5 sm:px-6">
                <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-emerald-100 to-slate-100 dark:from-slate-800 dark:to-slate-800">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="grid size-full place-items-center">
                      <PackageOpen className="size-8 text-slate-300" strokeWidth={1} />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <h3 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
                    <p className="mt-1 text-lg font-black text-emerald-700">
                      PKR {item.price.toLocaleString("en-PK")}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="flex size-8 items-center justify-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addItem({ ...item, quantity: 1 })}
                        className="flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700"
                      aria-label="Remove item"
                    >
                      <Trash2 className="size-3" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="sticky top-24 h-fit rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Order summary</h3>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal ({count} {count === 1 ? "item" : "items"})</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">PKR {total.toLocaleString("en-PK")}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Shipping</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">Calculated at checkout</span>
              </div>
            </div>
            <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
              <div className="flex justify-between text-base">
                <span className="font-bold text-slate-900 dark:text-slate-100">Estimated total</span>
                <span className="font-black text-emerald-700">PKR {total.toLocaleString("en-PK")}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleProceedToCheckout}
              disabled={pendingAuth}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
            >
              {pendingAuth ? "Checking your session…" : "Proceed to checkout"}
            </button>
            <Link
              href="/#featured"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-200"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}