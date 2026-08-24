"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoaderCircle, PackageCheck, ShoppingBag, Zap } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/types/database";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const supabase = createClient();
    if (!id) return;
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        const found = (data as Product | null) ?? null;
        setProduct(found);
        if (found) {
          supabase
            .from("products")
            .select("*")
            .eq("category", found.category)
            .neq("id", found.id)
            .limit(4)
            .then(({ data: rel }) => {
              setRelated((rel ?? []) as Product[]);
            });
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="grid min-h-[60vh] place-items-center py-20">
          <LoaderCircle className="size-10 animate-spin text-emerald-700" />
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <PackageCheck className="mx-auto size-14 text-slate-300 dark:text-slate-700" strokeWidth={1} />
          <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-slate-100">Product not found</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">This product may have been removed from the collection.</p>
          <Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">Back to shop</Link>
        </main>
        <Footer />
      </>
    );
  }

  const images = product.image_url ? [product.image_url] : [];
  const gallery = images.length > 0 ? images : [null];

  const addToCart = (qty: number) => {
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      quantity: qty,
      image_url: product.image_url ?? undefined,
    });
  };

  // Buy Now: add to cart with the selected quantity, then go straight to checkout.
  const buyNow = () => {
    addToCart(quantity);
    router.push("/checkout");
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href={`/categories/${product.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        >
          ← Back to {product.category}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 to-slate-100">
              {gallery[activeImage] ? (
                <img src={gallery[activeImage]} alt={product.title} className="size-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center">
                  <PackageCheck className="size-24 text-slate-300" strokeWidth={1} />
                </div>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {gallery.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative size-16 shrink-0 overflow-hidden rounded-lg border ${idx === activeImage ? "border-emerald-600" : "border-slate-200 dark:border-slate-700"}`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    {src ? (
                      <img src={src} alt="" className="size-full object-cover" />
                    ) : (
                      <PackageCheck className="mx-auto size-8 text-slate-300" strokeWidth={1} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">{product.category}</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">{product.title}</h1>
            <p className="mt-4 text-3xl font-black text-emerald-700">PKR {product.price.toLocaleString("en-PK")}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>

            <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Description</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {product.description || "A considered essential from the VEXIS pk collection."}
              </p>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Qty</span>
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Decrease quantity"
              >−</button>
              <span className="flex size-9 items-center justify-center text-sm font-bold text-slate-900 dark:text-slate-100">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Increase quantity"
              >+</button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => addToCart(quantity)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-6 py-3.5 text-sm font-bold text-white hover:bg-emerald-800"
              >
                <ShoppingBag className="size-4" />
                Add to Cart
              </button>
              <button
                type="button"
                onClick={buyNow}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-700 px-6 py-3.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
              >
                <Zap className="size-4" />
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16 border-t border-slate-100 pt-10 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">You may also like</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">Related products</h2>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {related.map((item) => (
                <Link key={item.id} href={`/products/${item.id}`} className="group min-w-0">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-emerald-100 to-slate-100 dark:from-slate-800 dark:to-slate-800">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="size-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center">
                        <PackageCheck className="size-16 text-slate-300 dark:text-slate-700" strokeWidth={1} />
                      </div>
                    )}
                  </div>
                  <h3 className="mt-4 truncate text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
                  <p className="mt-1 text-lg font-black text-emerald-700">PKR {item.price.toLocaleString("en-PK")}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
