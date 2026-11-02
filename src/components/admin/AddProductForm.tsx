"use client";

import { Check, ImagePlus, LoaderCircle, Plus, Tag } from "lucide-react";
import { useActionState, useMemo, useState, type FormEvent, useTransition } from "react";

import { addProduct } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/client";
import {
  removeFromBucket,
  uploadToBucket,
  uploadVideoToBucket,
  validateImageFile,
  validateVideoFile,
} from "@/lib/upload-image";
import { uploadToBlob, uploadVideoToBlob } from "@/lib/blob-upload";
import { defByKey, resolveCategoryFields } from "@/lib/product-attributes";
import type { AttributeDef } from "@/lib/product-attributes";
import type { Category } from "@/types/database";

const fieldClassName =
  "mt-2 w-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-600";

const labelClassName =
  "text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50";

const COLOR_OPTIONS = defByKey("color_family")?.options ?? [];

/** Live discount badge shown when an original price beats the current price. */
function DiscountPreview({ price, original }: { price: string; original: string }) {
  const current = Number(price);
  const wasPrice = Number(original);
  if (!Number.isFinite(current) || !Number.isFinite(wasPrice)) return null;
  if (wasPrice <= current || current <= 0) return null;
  const percent = Math.round(((wasPrice - current) / wasPrice) * 100);
  return (
    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#d4b06a]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#d4b06a]">
      <Tag className="size-3" />
      Save {percent}% — PKR {(wasPrice - current).toLocaleString("en-PK")} off
    </span>
  );
}

export function AddProductForm({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(addProduct, {});
  const [isPending, startTransition] = useTransition();
  const [categoryName, setCategoryName] = useState("");
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedVideos, setSelectedVideos] = useState(0);
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  // Direct-to-Storage upload state (progress + graceful failures).
  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Dynamic spec generator: whichever custom attributes are enabled for the
  // selected category render as extra inputs below the core product fields.
  const activeCategory = categories.find((item) => item.name === categoryName);
  const specDefs: AttributeDef[] = useMemo(
    () => (activeCategory ? resolveCategoryFields(activeCategory) : []),
    [activeCategory],
  );

  // Uploads every picked media file straight from the browser to Supabase
  // Storage, then submits only the resulting public URLs to the server action.
  // Large videos therefore never pass through the server-action body (which
  // triggered `Body exceeded 1 MB limit` / 413 crashes before).
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (uploading || pending) return;

    const form = event.currentTarget;
    const imageInput = form.elements.namedItem("images");
    const videoInput = form.elements.namedItem("videos");
    const imageFiles =
      imageInput instanceof HTMLInputElement ? Array.from(imageInput.files ?? []) : [];
    const videoFiles =
      videoInput instanceof HTMLInputElement ? Array.from(videoInput.files ?? []) : [];

    setUploadError(null);
    setUploadNote("");

    // Validate before uploading anything — instant feedback, zero wasted bytes.
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
      const total = imageFiles.length + videoFiles.length;
      let done = 0;

      const images: string[] = [];
      for (const file of imageFiles) {
        setUploadNote(`Uploading photo ${++done} of ${total}…`);
        const result = await uploadToBlob(file, "products");
        images.push(result.url);
        uploaded.push(result.url);
      }

      const videos: string[] = [];
      for (const file of videoFiles) {
        setUploadNote(`Uploading video ${++done} of ${total}…`);
        const result = await uploadVideoToBlob(file, "products");
        videos.push(result.url);
        uploaded.push(result.url);
      }

      if (total > 0) setUploadNote("Media uploaded — saving product…");

      // Submit URL strings only; the action body stays a few kilobytes.
      const formData = new FormData(form);
      formData.delete("images");
      formData.delete("videos");
      if (images.length > 0) {
        formData.append("uploaded_images", JSON.stringify(images));
      }
      if (videos.length > 0) {
        formData.append("uploaded_videos", JSON.stringify(videos));
      }

startTransition(() => {
        action(formData);
      });
    } catch (uploadError) {
      // Roll back whatever already reached Storage so no orphans linger.
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
    <form action={action} onSubmit={handleSubmit} className="space-y-5 text-slate-600">
      {/* Core identity ------------------------------------------------------ */}
      <div>
        <label className={labelClassName}>
          Product title
          <input name="title" required placeholder="Aurelia Chronograph" className={fieldClassName} />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Brand
          <input name="brand" placeholder="e.g. Seiko" className={fieldClassName} />
        </label>
        <label className={labelClassName}>
          Category
          <select
            name="category"
            required
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            className={`${fieldClassName} appearance-none`}
          >
            <option value="" disabled>Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
        </label>
      </div>

      <label className={labelClassName}>
        Description
        <textarea
          name="description"
          required
          placeholder="A considered essential for every day."
          className={`${fieldClassName} min-h-24 resize-y`}
        />
      </label>

      {/* Pricing ------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Current price (PKR)
          <input
            name="price"
            required min="0" step="0.01" type="number"
            placeholder="24999"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={fieldClassName}
          />
        </label>
        <label className={labelClassName}>
          Original price (optional)
          <input
            name="original_price"
            min="0" step="0.01" type="number"
            placeholder="34999"
            value={originalPrice}
            onChange={(event) => setOriginalPrice(event.target.value)}
            className={fieldClassName}
          />
        </label>
      </div>
      <DiscountPreview price={price} original={originalPrice} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Color family
          <select name="color_family" defaultValue="" className={`${fieldClassName} appearance-none`}>
            <option value="">Select a color</option>
            {COLOR_OPTIONS.map((color) => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </label>
        <label className={labelClassName}>
          Quantity (stock)
          <input name="stock" required min="0" step="1" type="number" placeholder="24" className={fieldClassName} />
        </label>
      </div>

      {/* Direct Supabase Storage upload ------------------------------------ */}
      <div>
        <p className={labelClassName}>
          Product images
          <span className="ml-2 normal-case tracking-normal text-white/35">
            first photo becomes the cover
          </span>
        </p>
        <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-4 py-6 text-center transition hover:border-[#d4b06a]/70">
          <ImagePlus className="size-6 text-[#d4b06a]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-white/90">
            Choose photos
          </span>
          <span className="text-xs text-white/45">
            PNG, JPG, WEBP · up to 5 MB each · multiples allowed
          </span>
          <input
            type="file"
            name="images"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            multiple
            required
            onChange={(event) => setSelectedCount(event.target.files?.length ?? 0)}
            className="sr-only"
          />
        </label>
        {selectedCount > 0 ? (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
            <Check className="size-3.5" />
            {selectedCount} photo{selectedCount === 1 ? "" : "s"} ready to upload
          </span>
        ) : (
          <p className="mt-2 text-[11px] leading-4 text-white/35">
            Photos upload directly to Supabase Storage when you save.
          </p>
        )}
      </div>

      {/* Product videos — optional, upload straight to Storage. */}
      <div>
        <p className={labelClassName}>
          Product videos
          <span className="ml-2 normal-case tracking-normal text-white/35">
            optional · mp4 / webm, max 100 MB
          </span>
        </p>
        <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-4 py-6 text-center transition hover:border-[#d4b06a]/70">
          <ImagePlus className="size-6 text-[#d4b06a]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-white/90">
            Choose videos
          </span>
          <span className="text-xs text-white/45">
            MP4, WEBM, MOV · up to 100 MB each · multiples allowed
          </span>
          <input
            type="file"
            name="videos"
            accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v"
            multiple
            onChange={(event) => setSelectedVideos(event.target.files?.length ?? 0)}
            className="sr-only"
          />
        </label>
        {selectedVideos > 0 ? (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
            <Check className="size-3.5" />
            {selectedVideos} video{selectedVideos === 1 ? "" : "s"} ready to upload
          </span>
        ) : (
          <p className="mt-2 text-[11px] leading-4 text-white/35">
            Videos flow into the alternating gallery (image → video → image → …).
          </p>
        )}
      </div>

      {/* Dynamic category-driven specification generator -------------------- */}
      {specDefs.length > 0 ? (
        <fieldset className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <legend className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4b06a]">
            {categoryName} specifications
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {specDefs.map((def) => (
              <label key={def.key} className={labelClassName}>
                {def.label}
                {def.type === "select" && def.options ? (
                  <select name={`spec_${def.key}`} defaultValue="" className={`${fieldClassName} appearance-none`}>
                    <option value="">Select…</option>
                    {def.options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={`spec_${def.key}`}
                    type={def.type === "number" ? "number" : "text"}
                    placeholder={def.placeholder ?? ""}
                    className={fieldClassName}
                  />
                )}
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-white/40">
            These inputs come from the attributes enabled for this category — edit them any time from Categories → ✎.
          </p>
        </fieldset>
      ) : null}

      {uploadError ? (
        <p role="alert" className="border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {uploadError}
        </p>
      ) : null}
      {state.error ? <p role="alert" className="border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{state.error}</p> : null}
      {state.success ? <p role="status" className="border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending || uploading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-700 px-5 py-4 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:cursor-wait disabled:opacity-60"
      >
        {uploading || pending ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
        {uploading
          ? uploadNote || "Uploading media…"
          : pending
            ? "Saving product…"
            : "Add to inventory"}
      </button>
    </form>
  );
}