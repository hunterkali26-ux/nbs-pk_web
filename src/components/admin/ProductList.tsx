"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Edit3, ImagePlus, LoaderCircle, Trash2, X } from "lucide-react";
import { useActionState, useOptimistic, useState, useTransition, type FormEvent } from "react";

import { deleteProduct, updateProduct } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/client";
import {
  removeFromBucket,
  uploadToBucket,
  uploadVideoToBucket,
  validateImageFile,
  validateVideoFile,
} from "@/lib/upload-image";
import { defByKey, resolveCategoryFields } from "@/lib/product-attributes";
import type { AttributeDef } from "@/lib/product-attributes";
import type { Category, Product } from "@/types/database";

const field =
  "mt-2 w-full border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#d4b06a] dark:border-white/15 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "block text-xs font-semibold uppercase tracking-widest";
const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);

const COLOR_OPTIONS = defByKey("color_family")?.options ?? [];

function EditProduct({
  product,
  categories,
  close,
}: {
  product: Product;
  categories: Category[];
  close: () => void;
}) {
  const [state, action, pending] = useActionState(updateProduct, {});
  const [categoryName, setCategoryName] = useState(product.category);
  const [imageUrls, setImageUrls] = useState<string[]>(
    product.images?.length ? product.images : product.image_url ? [product.image_url] : [""],
  );
  const [videoUrls, setVideoUrls] = useState<string[]>(product.videos?.length ? product.videos : [""]);

  // Direct-to-Storage upload state (progress + graceful failures).
  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const activeCategory = categories.find((item) => item.name === categoryName);
  const specDefs: AttributeDef[] = activeCategory ? resolveCategoryFields(activeCategory) : [];

  // Seed dynamic spec inputs with any values already stored on the product.
  const existingSpec = (key: string) =>
    product.specs?.find((spec) => spec.key === key)?.value ?? "";

  // Uploads newly picked media straight from the browser to Supabase Storage,
  // then submits only URL strings — large videos never cross the server-action
  // body limit (which caused `Body exceeded 1 MB limit` / 413 crashes).
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (uploading || pending) return;

    const form = event.currentTarget;
    const imageInput = form.elements.namedItem("new_images");
    const videoInput = form.elements.namedItem("new_videos");
    const imageFiles =
      imageInput instanceof HTMLInputElement ? Array.from(imageInput.files ?? []) : [];
    const videoFiles =
      videoInput instanceof HTMLInputElement ? Array.from(videoInput.files ?? []) : [];

    setUploadError(null);
    setUploadNote("");

    for (const file of imageFiles) {
      const problem = validateImageFile(file);
      if (problem) {
        setUploadError(problem);
        return;
      }
    }
    for (const file of videoFiles) {
      const problem = validateVideoFile(file);
      if (problem) {
        setUploadError(problem);
        return;
      }
    }

    const uploaded: string[] = [];
    setUploading(true);
    try {
      const supabase = createClient();
      const total = imageFiles.length + videoFiles.length;
      let done = 0;

      const newImages: string[] = [];
      for (const file of imageFiles) {
        setUploadNote(`Uploading photo ${++done} of ${total}…`);
        newImages.push(await uploadToBucket(supabase, "products", file));
        uploaded.push(newImages[newImages.length - 1]);
      }

      const newVideos: string[] = [];
      for (const file of videoFiles) {
        setUploadNote(`Uploading video ${++done} of ${total}…`);
        newVideos.push(await uploadVideoToBucket(supabase, "products", file));
        uploaded.push(newVideos[newVideos.length - 1]);
      }

      if (total > 0) setUploadNote("Media uploaded — saving changes…");

      const formData = new FormData(form);
      formData.delete("new_images");
      formData.delete("new_videos");
      if (newImages.length > 0) {
        formData.append("uploaded_images", JSON.stringify(newImages));
      }
      if (newVideos.length > 0) {
        formData.append("uploaded_videos", JSON.stringify(newVideos));
      }

      action(formData);
    } catch (uploadError) {
      try {
        if (uploaded.length > 0) {
          await removeFromBucket(createClient(), "products", uploaded);
        }
      } catch {
        // Best-effort cleanup — never mask the real error.
      }
      console.error("Media upload failed:", uploadError);
      setUploadError(
        uploadError instanceof Error
          ? uploadError.message
          : "Something went wrong while uploading. Please check your connection and try again.",
      );
    } finally {
      setUploading(false);
      setUploadNote("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172a2a]/70 p-4 sm:p-5">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto bg-[#f1efe9] p-5 shadow-2xl sm:p-6 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-2xl sm:text-3xl">Edit product</h2>
          <button type="button" onClick={close} aria-label="Close" className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/10">
            <X className="size-5" />
          </button>
        </div>

        <form action={action} onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="id" value={product.id} />

          <label className={labelClass}>
            Title
            <input name="title" defaultValue={product.title} className={field} required />
          </label>

          <label className={labelClass}>
            Brand
            <input name="brand" defaultValue={product.brand ?? ""} placeholder="e.g. Seiko" className={field} />
          </label>

          <label className={labelClass}>
            Description
            <textarea name="description" defaultValue={product.description ?? ""} className={`${field} min-h-20`} />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              Price
              <input name="price" type="number" min="0" step="0.01" defaultValue={product.price} className={field} required />
            </label>
            <label className={labelClass}>
              Original price
              <input
                name="original_price"
                type="number" min="0" step="0.01"
                defaultValue={product.original_price ?? ""}
                placeholder="Optional"
                className={field}
              />
            </label>
            <label className={labelClass}>
              Quantity (stock)
              <input name="stock" type="number" min="0" defaultValue={product.stock} className={field} required />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Category
              <select
                name="category"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                className={field}
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Color family
              <select name="color_family" defaultValue={product.color_family ?? ""} className={field}>
                <option value="">Select…</option>
                {COLOR_OPTIONS.map((color) => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Gallery — existing photos stay unless removed; new picks upload */}
          <div>
            <p className={labelClass}>Gallery</p>

            {imageUrls.filter(Boolean).length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {imageUrls.map((url, index) =>
                  !url ? null : (
                    <div
                      key={index}
                      className="group relative size-16 overflow-hidden rounded-lg border border-black/10 dark:border-white/15"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrls((urls) => urls.filter((_, i) => i !== index))}
                        aria-label={`Remove image ${index + 1}`}
                        className="absolute inset-0 grid place-items-center bg-black/55 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                      >
                        <Trash2 className="size-4 text-white" />
                      </button>
                    </div>
                  ),
                )}
                {/* Hidden inputs preserve surviving URLs through the POST. */}
                {imageUrls.filter(Boolean).map((url, index) => (
                  <input key={`keep-${index}`} type="hidden" name="keep_images" value={url} />
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-black/40 dark:text-slate-500">No photos yet.</p>
            )}

            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-4 text-xs font-semibold uppercase tracking-widest text-slate-500 transition hover:border-[#d4b06a] dark:border-slate-700 dark:text-slate-400">
              <ImagePlus className="size-4" />
              Add more photos
              <input
                type="file"
                name="new_images"
                accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                multiple
                className="sr-only"
              />
            </label>
            <p className="mt-1.5 text-[11px] leading-4 text-black/35 dark:text-slate-500">
              PNG/JPG/WEBP up to 5 MB each — uploads go straight to Supabase Storage.
            </p>
          </div>

          {/* Videos — existing survive via hidden inputs; new picks upload. */}
          <div>
            <p className={labelClass}>Videos</p>

            {videoUrls.filter(Boolean).length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {videoUrls.map((url, index) =>
                  !url ? null : (
                    <div
                      key={index}
                      className="group relative flex size-20 items-center justify-center overflow-hidden rounded-lg border border-black/10 bg-slate-100 text-xs text-black/50 dark:border-white/15 dark:bg-slate-800"
                    >
                      <video src={url} className="size-full object-cover" controls muted playsInline preload="metadata" />
                      <button
                        type="button"
                        onClick={() => setVideoUrls((urls) => urls.filter((_, i) => i !== index))}
                        aria-label={`Remove video ${index + 1}`}
                        className="absolute inset-0 grid place-items-center bg-black/55 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                      >
                        <Trash2 className="size-4 text-white" />
                      </button>
                    </div>
                  ),
                )}
                {videoUrls.filter(Boolean).map((url, index) => (
                  <input key={`keepv-${index}`} type="hidden" name="keep_videos" value={url} />
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-black/40 dark:text-slate-500">No videos yet.</p>
            )}

            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-4 text-xs font-semibold uppercase tracking-widest text-slate-500 transition hover:border-[#d4b06a] dark:border-slate-700 dark:text-slate-400">
              <ImagePlus className="size-4" />
              Add videos
              <input
                type="file"
                name="new_videos"
                accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v"
                multiple
                className="sr-only"
              />
            </label>
            <p className="mt-1.5 text-[11px] leading-4 text-black/35 dark:text-slate-500">
              MP4/WEBM/MOV up to 100 MB each — flows into the alternating gallery.
            </p>
          </div>

          {/* Dynamic category specs ---------------------------------------- */}
          {specDefs.length > 0 ? (
            <fieldset className="rounded-xl border border-black/10 p-4 dark:border-white/10">
              <legend className="px-2 text-xs font-semibold uppercase tracking-widest text-[#d4b06a]">
                {categoryName} specifications
              </legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {specDefs.map((def) => (
                  <label key={def.key} className={labelClass}>
                    {def.label}
                    {def.type === "select" && def.options ? (
                      <select name={`spec_${def.key}`} defaultValue={existingSpec(def.key)} className={field}>
                        <option value="">Select…</option>
                        {def.options.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        name={`spec_${def.key}`}
                        type={def.type === "number" ? "number" : "text"}
                        defaultValue={existingSpec(def.key)}
                        placeholder={def.placeholder ?? ""}
                        className={field}
                      />
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {uploadError ? <p role="alert" className="text-sm text-red-700 dark:text-red-400">{uploadError}</p> : null}
          {state.error ? <p role="alert" className="text-sm text-red-700 dark:text-red-400">{state.error}</p> : null}

          <button
            type="submit"
            disabled={pending || uploading}
            className="flex w-full items-center justify-center gap-2 bg-[#172a2a] px-4 py-3 text-sm font-semibold uppercase tracking-widest text-white disabled:opacity-60"
          >
            {uploading || pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {uploading ? uploadNote || "Uploading media…" : pending ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function ProductList({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const [items, remove] = useOptimistic(products, (current, id: string) =>
    current.filter((item) => item.id !== id),
  );
  const [editing, setEditing] = useState<Product | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      {editing ? (
        <EditProduct product={editing} categories={categories} close={() => setEditing(null)} />
      ) : null}

      <div className="overflow-hidden border border-black/10 bg-white dark:border-white/10 dark:bg-slate-900">
        <div className="hidden grid-cols-[minmax(15rem,1.5fr)_1fr_0.9fr_0.6fr_auto] gap-4 border-b border-black/10 px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/40 md:grid dark:border-white/10 dark:text-slate-500">
          <span>Product</span>
          <span>Category / Brand</span>
          <span>Price</span>
          <span>Stock</span>
          <span />
        </div>

        {items.map((product) => (
          <div
            key={product.id}
            className="grid gap-3 border-b border-black/8 px-5 py-4 last:border-0 md:grid-cols-[minmax(15rem,1.5fr)_1fr_0.9fr_0.6fr_auto] md:items-center md:gap-4 dark:border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="relative size-14 shrink-0 overflow-hidden bg-[#f0eee8] dark:bg-slate-800">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.title} fill sizes="56px" unoptimized className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{product.title}</p>
                <p className="truncate text-xs text-black/40 dark:text-slate-500">{product.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 md:contents">
              <span className="text-xs capitalize text-black/60 dark:text-slate-300">
                {product.category}
                {product.brand ? <span className="ml-1.5 text-black/35 dark:text-slate-500">· {product.brand}</span> : null}
              </span>
              <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
              <span className={product.stock < 5 ? "font-semibold text-red-600" : "text-black/60 dark:text-slate-300"}>
                {product.stock}
              </span>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setEditing(product)}
                aria-label="Edit product"
                className="-m-2 p-2 text-[#d4b06a]"
              >
                <Edit3 className="size-4" />
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    remove(product.id);
                    const result = await deleteProduct(product.id);
                    if (result.error) {
                      // Soft-resync: re-render the server component instead of a
                      // full browser reload, so React state survives.
                      router.refresh();
                    }
                  })
                }
                aria-label={`Delete ${product.title}`}
                className="-m-2 p-2 text-red-600 disabled:opacity-40"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 ? (
          <p className="p-12 text-center text-sm text-black/45 dark:text-slate-400">
            No products yet — add your first piece from the form.
          </p>
        ) : null}
      </div>
    </>
  );
}