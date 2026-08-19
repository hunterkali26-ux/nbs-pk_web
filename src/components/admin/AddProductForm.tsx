"use client";

import { ImagePlus, LoaderCircle, Plus } from "lucide-react";
import { useActionState } from "react";

import { addProduct } from "@/app/admin/actions";
import type { Category } from "@/types/database";

const fieldClassName =
  "mt-2 w-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d4b06a]";

export function AddProductForm({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(addProduct, {});

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
          Product title
          <input name="title" required placeholder="Aurelia Chronograph" className={fieldClassName} />
        </label>
      </div>

      <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
        Description
        <textarea name="description" required placeholder="A considered essential for every day." className={`${fieldClassName} min-h-24 resize-y`} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
          Price (PKR)
          <input name="price" required min="0" step="0.01" type="number" placeholder="24999" className={fieldClassName} />
        </label>
        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
          Stock
          <input name="stock" required min="0" step="1" type="number" placeholder="24" className={fieldClassName} />
        </label>
      </div>

      <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
        Category
        <select name="category" required defaultValue="" className={`${fieldClassName} appearance-none`}>
          <option value="" disabled>Select a category</option>
          {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
        </select>
      </label>

      <label className="block cursor-pointer border border-dashed border-white/15 bg-white/[0.02] p-5 text-center transition hover:border-[#d4b06a]/70">
        <ImagePlus className="mx-auto mb-3 size-6 text-[#d4b06a]" />
        <span className="block text-xs font-semibold uppercase tracking-[0.15em] text-white/70">Product image</span>
        <span className="mt-1 block text-xs text-white/35">PNG, JPG, WEBP up to 5 MB</span>
        <input name="image" required type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" />
      </label>

      {state.error ? <p role="alert" className="border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{state.error}</p> : null}
      {state.success ? <p role="status" className="border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{state.success}</p> : null}

      <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-2 bg-[#d4b06a] px-5 py-4 text-sm font-semibold text-[#172a2a] transition hover:bg-[#e1c589] disabled:cursor-wait disabled:opacity-60">
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
        {pending ? "Uploading product..." : "Add to inventory"}
      </button>
    </form>
  );
}