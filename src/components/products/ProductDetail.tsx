"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
  ZoomIn,
} from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductReviews } from "@/components/products/ProductReviews";
import { useCart } from "@/lib/cart-context";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import type { Product, ProductMedia, ProductReview } from "@/types/database";

/** Hex swatches for the color-family selector (falls back to a neutral dot). */
const COLOR_SWATCHES: Record<string, string> = {
  Black: "#111827", White: "#f8fafc", Silver: "#cbd5e1", Grey: "#94a3b8",
  Gold: "#d4af37", "Rose Gold": "#b76e79", Brown: "#78350f", Tan: "#d2b48c",
  Beige: "#e5d3b3", Red: "#dc2626", Blue: "#2563eb", Navy: "#1e3a5f",
  Green: "#16a34a", Olive: "#6b7a3a", Purple: "#7c3aed", Pink: "#ec4899",
  Orange: "#ea580c", Clear: "#e2e8f0",
};

const swatchFor = (name: string) => COLOR_SWATCHES[name] ?? "#94a3b8";

const formatPKR = (value: number) => `PKR ${Number(value || 0).toLocaleString("en-PK")}`;

/**
 * Fullscreen image lightbox with zoom toggle, prev/next navigation, Escape to
 * close and backdrop click-to-dismiss. Works identically on touch and desktop.
 */
function Lightbox({
  media,
  index,
  title,
  onClose,
  onNavigate,
}: {
  media: ProductMedia[];
  index: number;
  title: string;
  onClose: () => void;
  onNavigate: (next: number) => void;
}) {
  const [zoomed, setZoomed] = useState(false);

  const goPrev = useCallback(
    () => onNavigate((index - 1 + media.length) % media.length),
    [index, media.length, onNavigate],
  );
  const goNext = useCallback(
    () => onNavigate((index + 1) % media.length),
    [index, media.length, onNavigate],
  );

  // Keyboard shortcuts: Esc closes, arrows navigate.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, onClose]);

  // Lock page scroll while the lightbox is open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const current = media[index];

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-slate-950/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — slide ${index + 1} of ${media.length}`}
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
          {index + 1} / {media.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close viewer"
          className="rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Stage */}
      <div
        className={`relative flex min-h-0 flex-1 items-center justify-center ${
          zoomed ? "overflow-auto p-4" : "px-4"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous slide"
          className="absolute left-3 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/25 sm:left-6"
        >
          <ChevronLeft className="size-5" />
        </button>

        {current?.type === "video" ? (
          <video
            src={current.url}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="max-h-[70vh] max-w-full rounded-xl"
          />
        ) : current?.type === "image" ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={current.url}
            alt={`${title} — enlarged view ${index + 1}`}
            onClick={() => setZoomed((zoom) => !zoom)}
            className={`mx-auto select-none rounded-xl object-contain transition-transform duration-200 ${
              zoomed
                ? "max-h-none w-[180%] max-w-none cursor-zoom-out scale-100"
                : "max-h-[70vh] max-w-full cursor-zoom-in"
            }`}
            draggable={false}
          />
        ) : (
          <PackageCheck
            className="size-20 text-slate-300 dark:text-slate-600"
            strokeWidth={1}
          />
        )}

        <button
          type="button"
          onClick={goNext}
          aria-label="Next slide"
          className="absolute right-3 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/25 sm:right-6"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Bottom controls — zoom only applies to images */}
      {current?.type === "image" ? (
        <div className="flex shrink-0 items-center justify-center gap-3 px-4 py-4">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setZoomed((zoom) => !zoom);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/25"
          >
            <ZoomIn className="size-4" />
            {zoomed ? "Reset zoom" : "Zoom in"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ProductDetail({
  product,
  reviews,
  related,
}: {
  product: Product;
  reviews: ProductReview[];
  related: Product[];
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const [navPending, startNav] = useTransition();

  // Gallery: prefer the multi-image list, fall back to the single cover URL.
  const images: (string | null)[] = (
    product.images?.length ? product.images : product.image_url ? [product.image_url] : [null]
  ) as (string | null)[];

  // Unified alternating media sequence — image → video → image → video …
  const imagesList = images.filter((src): src is string => Boolean(src));
  const videosList = (product.videos ?? []).filter((src): src is string => Boolean(src && src.trim()));
  const media = useMemo(() => {
    // Interleave ALL images and videos in the required sequence:
    // picture → video → picture → video … (extra images/videos trail on).
    // Never index by the merged position — that silently skips media.
    const merged: ProductMedia[] = [];
    let imgIdx = 0;
    let vidIdx = 0;
    while (imgIdx < imagesList.length || vidIdx < videosList.length) {
      if (imgIdx < imagesList.length) {
        merged.push({ type: "image", url: imagesList[imgIdx++] });
      }
      if (vidIdx < videosList.length) {
        merged.push({ type: "video", url: videosList[vidIdx++] });
      }
    }
    return merged;
  }, [imagesList, videosList]);

  const [activeMedia, setActiveMedia] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(product.color_family ?? "");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const discountPercent =
    product.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : null;

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const addToCart = () => {
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      quantity,
      image_url: (images[0] as string | undefined) ?? undefined,
    });
  };

  // Buy Now: add to cart + navigate in a transition so the button shows an
  // immediate spinner (no perceptible click lag).
  const buyNow = () => {
    startNav(() => {
      addToCart();
      router.push("/checkout");
    });
  };

  const categorySlug = product.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <>
      <Navbar />

      {lightboxIndex !== null ? (
        <Lightbox
          media={media}
          index={lightboxIndex}
          title={product.title}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      ) : null}

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="transition hover:text-emerald-700 dark:hover:text-emerald-400">Home</Link>
          <span>/</span>
          <Link href={`/categories/${categorySlug}`} className="capitalize transition hover:text-emerald-700 dark:hover:text-emerald-400">
            {product.category}
          </Link>
          <span>/</span>
          <span className="truncate font-semibold text-slate-900 dark:text-slate-200">{product.title}</span>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Gallery ------------------------------------------------------- */}
          <div>
            <button
              type="button"
              onClick={() => setLightboxIndex(activeMedia)}
              className="group relative block w-full overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 to-slate-100 dark:from-slate-800 dark:to-slate-900"
              aria-label={`Open slide ${activeMedia + 1} in fullscreen viewer`}
            >
              {media[activeMedia]?.type === "video" ? (
                <span className="relative grid aspect-[4/5] w-full place-items-center bg-slate-950">
                  <video
                    src={media[activeMedia].url}
                    className="aspect-[4/5] h-full w-full object-contain"
                    controls
                    playsInline
                    preload="metadata"
                  />
                </span>
              ) : media[activeMedia]?.type === "image" ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={media[activeMedia].url}
                  alt={product.title}
                  loading="eager"
                  className="aspect-[4/5] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="grid aspect-[4/5] place-items-center">
                  <PackageCheck
                    className="size-20 text-slate-300 dark:text-slate-600"
                    strokeWidth={1}
                  />
                </div>
              )}
            </button>

            {media.length > 1 ? (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {media.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveMedia(idx)}
                    className={`relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition sm:size-20 ${
                      idx === activeMedia ? "border-emerald-600" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`View slide ${idx + 1}`}
                  >
                    {item.type === "video" ? (
                      <video src={item.url} className="size-full object-cover" muted playsInline preload="metadata" />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.url} alt="" loading="lazy" className="size-full object-cover" />
                    )}
                    {item.type === "video" ? (
                      <span className="absolute inset-0 grid place-items-center bg-black/25 text-[8px] font-bold uppercase tracking-wider text-white">
                        ▶
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: Truck, label: "Nationwide delivery" },
                { icon: ShieldCheck, label: "100% authentic" },
                { icon: RotateCcw, label: "7-day easy returns" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-xl border border-slate-100 px-2 py-3 dark:border-slate-800">
                  <Icon className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="mt-1.5 text-[11px] leading-tight text-slate-500 dark:text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Buy box ------------------------------------------------------- */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
              {product.category}
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
              {product.title}
            </h1>

            {/* Brand */}
            <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300">
              Brand:{" "}
              <span className="font-bold capitalize text-slate-900 dark:text-white">
                {product.brand || "VEXIS pk"}
              </span>
            </p>

            {/* Rating shortcut */}
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm">
              <Stars value={averageRating} />
              <span className="font-semibold text-slate-700 dark:text-slate-300">{averageRating.toFixed(1)}</span>
              <span className="text-slate-400 dark:text-slate-500">
                ({reviews.length} review{reviews.length === 1 ? "" : "s"})
              </span>
            </a>

            {/* Price block with strikethrough / discount ------------------ */}
            <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400 sm:text-4xl">
                {formatPKR(product.price)}
              </span>
              {discountPercent ? (
                <>
                  <span className="text-lg text-slate-400 line-through dark:text-slate-500">
                    {formatPKR(product.original_price as number)}
                  </span>
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-black text-red-700 dark:bg-red-950/60 dark:text-red-300">
                    −{discountPercent}%
                  </span>
                </>
              ) : null}
            </div>

            <p
              className={`mt-2 text-sm font-semibold ${
                product.stock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {product.stock > 0 ? `In stock — ${product.stock} available` : "Out of stock"}
            </p>

            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {product.description || "A considered essential from the VEXIS pk collection."}
            </p>

            {/* Color family selector ------------------------------------- */}
            {product.color_family ? (
              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                  Color family
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {[product.color_family].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      aria-pressed={selectedColor === color}
                      title={color}
                      className={`flex items-center gap-2 rounded-full border-2 py-1 pl-1 pr-3 text-xs font-semibold transition ${
                        selectedColor === color
                          ? "border-emerald-600 text-emerald-800 dark:border-emerald-400 dark:text-emerald-300"
                          : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span
                        className="size-6 rounded-full border border-black/10"
                        style={{ background: swatchFor(color) }}
                        aria-hidden="true"
                      />
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Quantity modifier ----------------------------------------- */}
            <div className="mt-6 flex items-center gap-4">
              <span className="text-sm font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Qty</span>
              <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="flex size-10 items-center justify-center text-lg text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Decrease quantity"
                >−</button>
                <input
                  value={quantity}
                  onChange={(event) => {
                    const next = Number(event.target.value.replace(/\D/g, ""));
                    setQuantity(
                      Math.min(
                        Math.max(Number.isFinite(next) && next > 0 ? next : 1, 1),
                        Math.max(product.stock, 1),
                      ),
                    );
                  }}
                  inputMode="numeric"
                  aria-label="Quantity"
                  className="h-10 w-12 border-x border-slate-200 bg-transparent text-center text-sm font-bold text-slate-900 outline-none dark:border-slate-700 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(q + 1, Math.max(product.stock, 1)))}
                  disabled={product.stock > 0 && quantity >= product.stock}
                  className="flex size-10 items-center justify-center text-lg text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Increase quantity"
                >+</button>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={addToCart}
                disabled={product.stock === 0 || navPending}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingBag className="size-4" />
                {navPending ? "Adding…" : "Add to Cart"}
              </button>
              <button
                type="button"
                onClick={buyNow}
                disabled={product.stock === 0 || navPending}
                className="inline-flex flex-1 items-center justify-center rounded-xl border-2 border-emerald-700 px-6 py-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
              >
                {navPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  "Buy Now"
                )}
              </button>
              <WishlistButton
                productId={product.id}
                productTitle={product.title}
                variant="detail"
              />
            </div>

            <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500 sm:text-left">
              Cash on Delivery available · Ships within 24 hours from our warehouse.
            </p>
          </div>
        </div>

        {/* Specifications table ----------------------------------------- */}
        <section className="mt-14 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Specifications</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { label: "Brand", value: product.brand },
                    { label: "Category", value: product.category },
                    { label: "Color family", value: product.color_family },
                    { label: "SKU / Product ID", value: product.id.slice(0, 8).toUpperCase() },
                    ...(product.specs ?? []).map((spec) => ({
                      label: spec.label,
                      value: spec.value,
                    })),
                  ]
                    .filter((row) => row.value)
                    .map((row) => (
                      <tr key={row.label} className="bg-white dark:bg-slate-900">
                        <th
                          scope="row"
                          className="w-1/3 bg-slate-50 px-4 py-3 align-top text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-950/40 dark:text-slate-400"
                        >
                          {row.label}
                        </th>
                        <td className="px-4 py-3 font-semibold capitalize text-slate-900 dark:text-slate-100">
                          {row.label === "SKU / Product ID" ? row.value : row.value}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comprehensive product details -------------------------------- */}
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Product details</h2>
            <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                {product.description || "A considered essential from the VEXIS pk collection."}
              </p>

              <ul className="space-y-2.5 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
                {[
                  `Brand: ${product.brand || "VEXIS pk"}`,
                  product.color_family ? `Color family: ${product.color_family}` : "",
                  product.original_price && product.original_price > product.price
                    ? `You save ${formatPKR(product.original_price - product.price)} versus the original price of ${formatPKR(product.original_price)}.`
                    : "",
                  "Quality-checked before dispatch from our warehouse.",
                  "Cash on Delivery (COD) available across Pakistan.",
                ]
                  .filter(Boolean)
                  .map((line) => (
                    <li key={line} className="flex gap-2.5 text-slate-600 dark:text-slate-300">
                      <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                      {line}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Reviews ------------------------------------------------------- */}
        <div className="mt-14">
          <ProductReviews productId={product.id} reviews={reviews} />
        </div>

        {/* Related products --------------------------------------------- */}
        {related.length > 0 ? (
          <section className="mt-16 border-t border-slate-100 pt-10 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
              You may also like
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">Related products</h2>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {related.map((item) => (
                <Link key={item.id} href={`/products/${item.id}`} className="group min-w-0">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-emerald-100 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                    {item.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.image_url}
                        alt={item.title}
                        loading="lazy"
                        className="size-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center">
                        <PackageCheck
                          className="size-14 text-slate-300 dark:text-slate-600"
                          strokeWidth={1}
                        />
                      </div>
                    )}
                  </div>
                  <h3 className="mt-4 truncate text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
                  <p className="mt-1 text-base font-black text-emerald-700 dark:text-emerald-400">
                    {formatPKR(item.price)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}

/** Compact read-only stars used in the buy box rating shortcut. */
function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`size-4 ${star <= Math.round(value) ? "fill-amber-400" : "fill-slate-200 dark:fill-slate-600"}`}
        >
          <path d="M10 1.6l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.7 1-5.8L1.5 7.8l5.9-.9L10 1.6z" />
        </svg>
      ))}
    </span>
  );
}



