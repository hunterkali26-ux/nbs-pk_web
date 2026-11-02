"use client";

import { Check, ImagePlus, Pencil, SlidersHorizontal, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useActionState, useState, useTransition } from "react";

import { addCategory, deleteCategory, updateCategory } from "@/app/admin/actions";
import { SELECTABLE_ATTRIBUTES } from "@/lib/product-attributes";
import type { Category } from "@/types/database";

const actionButton =
  "-m-1 rounded-lg p-2 text-[#d4b06a] transition hover:bg-black/5 dark:hover:bg-white/10";

/**
 * Interactive checkbox modal — pick which custom input fields/attributes are
 * enabled for products belonging to this category. Selections submit with the
 * category form as repeated `fields` checkboxes.
 */
function FieldsModal({
  title,
  selected,
  onToggle,
  onClose,
}: {
  title: string;
  selected: string[];
  onToggle: (key: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Select custom fields"
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4b06a]">Custom fields</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close field picker"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            Tick every attribute admins should fill in when adding a product of this
            category. Each one becomes an extra input box on the product form and a
            row in the storefront specifications table.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {SELECTABLE_ATTRIBUTES.map((attribute) => {
              const checked = selected.includes(attribute.key);
              return (
                <label
                  key={attribute.key}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${
                    checked
                      ? "border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="fields"
                    value={attribute.key}
                    checked={checked}
                    onChange={() => onToggle(attribute.key)}
                    className="size-4 accent-amber-600"
                  />
                  <span className="truncate font-medium">{attribute.label}</span>
                </label>
              );
            })}
          </div>

          {selected.length === 0 ? (
            <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              No fields selected yet — sensible defaults will be inferred from the category name.
            </p>
          ) : (
            <p className="mt-4 text-xs text-amber-700 dark:text-amber-400">
              {selected.length} field{selected.length === 1 ? "" : "s"} enabled.
            </p>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-[#172a2a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f1d1d]"
          >
            Done ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(addCategory, {});
  const [editing, setEditing] = useState<string | null>(null);
  const [removePending, startRemove] = useTransition();

  // Create-flow state: picked attribute keys + picker drawer visibility.
  const [createFields, setCreateFields] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Chosen cover photo filename (the file itself rides the form POST).
  const [createImageName, setCreateImageName] = useState("");

  // Edit-flow state mirrors the create flow for whichever row is open.
  const [editFields, setEditFields] = useState<string[]>([]);
  const [editPickerOpen, setEditPickerOpen] = useState(false);

  const toggleCreateField = (key: string) =>
    setCreateFields((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );

  const toggleEditField = (key: string) =>
    setEditFields((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        {/* Create form ---------------------------------------------------- */}
        <form action={action} className="h-fit bg-[#172a2a] p-6 text-white">
          <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-[#d4b06a]">New category</p>

          <input
            name="name"
            placeholder="e.g. Accessories"
            required
            className="w-full border-b border-white/20 bg-transparent px-0 py-3 text-sm outline-none placeholder:text-white/30 focus:border-[#d4b06a]"
          />

          {/* Hidden inputs carry the picked fields into the server action. */}
          {createFields.map((key) => (
            <input key={key} type="hidden" name="fields" value={key} />
          ))}

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="mt-5 flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-white/20 bg-white/[0.03] px-4 py-3 text-left transition hover:border-[#d4b06a]/70"
          >
            <span className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-widest text-white/90">
                Custom fields
              </span>
              <span className="mt-0.5 block truncate text-xs text-white/45">
                {createFields.length ? `${createFields.length} selected` : "Optional — tap to choose"}
              </span>
            </span>
            <SlidersHorizontal className="size-4 shrink-0 text-[#d4b06a]" />
          </button>

          {/* Cover photo — uploads straight to the categories bucket ---------- */}
          <label className="mt-5 block cursor-pointer rounded-lg border border-dashed border-white/20 bg-white/[0.03] px-4 py-4 text-center transition hover:border-[#d4b06a]/70">
            <ImagePlus className="mx-auto mb-1.5 size-5 text-[#d4b06a]" />
            <span className="block text-xs font-semibold uppercase tracking-widest text-white/90">
              Category image
            </span>
            <span className="mt-0.5 block text-xs text-white/45">
              Optional · shown on storefront cards
            </span>
            <input
              type="file"
              name="image"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              className="sr-only"
              onChange={(event) => setCreateImageName(event.target.files?.[0]?.name ?? "")}
            />
            {createImageName ? (
              <span className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-200">
                <Check className="size-3 shrink-0" />
                <span className="truncate">{createImageName}</span>
              </span>
            ) : null}
          </label>

          <button
            disabled={pending}
            className="mt-6 w-full bg-[#d4b06a] px-4 py-3 text-xs font-semibold uppercase tracking-widest text-[#172a2a]"
          >
            {pending ? "Adding" : "Add category"}
          </button>

          {state.error ? <p className="mt-4 text-sm text-red-200">{state.error}</p> : null}
          {state.success ? <p className="mt-4 text-sm text-amber-200">{state.success}</p> : null}
        </form>

        {/* Existing categories ------------------------------------------- */}
        <CategoryList
          categories={categories}
          editing={editing}
          setEditing={setEditing}
          editFields={editFields}
          setEditFields={setEditFields}
          editPickerOpen={editPickerOpen}
          setEditPickerOpen={setEditPickerOpen}
          removePending={removePending}
          startRemove={startRemove}
        />
      </div>

      {pickerOpen ? (
        <FieldsModal
          title="Fields for new category"
          selected={createFields}
          onToggle={toggleCreateField}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}

      {editing && editPickerOpen ? (
        <FieldsModal
          title={`Fields — ${categories.find((c) => c.id === editing)?.name ?? ""}`}
          selected={editFields}
          onToggle={toggleEditField}
          onClose={() => setEditPickerOpen(false)}
        />
      ) : null}
    </>
  );
}

interface CategoryListProps {
  categories: Category[];
  editing: string | null;
  setEditing: (id: string | null) => void;
  editFields: string[];
  setEditFields: (fields: string[]) => void;
  editPickerOpen: boolean;
  setEditPickerOpen: (open: boolean) => void;
  removePending: boolean;
  startRemove: (callback: () => Promise<void>) => void;
}

function CategoryList({
  categories,
  editing,
  setEditing,
  editFields,
  setEditFields,
  setEditPickerOpen,
  removePending,
  startRemove,
}: CategoryListProps) {
  return (
    <div className="divide-y divide-black/10 border border-black/10 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
      {categories.map((category) =>
        editing === category.id ? (
          <form
            key={category.id}
            action={async (formData) => {
              await updateCategory({}, formData);
              setEditing(null);
            }}
            className="space-y-3 p-5"
          >
            <input type="hidden" name="id" value={category.id} />
            {editFields.map((key) => (
              <input key={key} type="hidden" name="fields" value={key} />
            ))}
            <input
              name="name"
              defaultValue={category.name}
              required
              className="w-full border-b border-black/20 bg-transparent px-0 py-2 text-sm outline-none dark:border-slate-600"
            />

            {/* Cover photo — preview the current one, upload a replacement */}
            <div className="flex items-center gap-3">
              {category.image_url ? (
                <Image
                  src={category.image_url}
                  alt=""
                  width={56}
                  height={56}
                  sizes="56px"
                  className="size-14 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-black/5 text-black/30 dark:bg-white/10 dark:text-white/30">
                  <ImagePlus className="size-5" />
                </span>
              )}
              <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-xs font-semibold uppercase tracking-widest text-slate-500 transition hover:border-[#d4b06a] dark:border-slate-700 dark:text-slate-400">
                {category.image_url ? "Replace image" : "Upload image"}
                <input
                  type="file"
                  name="image"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                  className="sr-only"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditFields(category.fields ?? []);
                setEditPickerOpen(true);
              }}
              className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-left text-xs text-slate-600 transition hover:border-[#d4b06a] dark:border-slate-700 dark:text-slate-300"
            >
              {editFields.length
                ? `${editFields.length} custom field${editFields.length === 1 ? "" : "s"} enabled`
                : "Choose custom fields"}{" "}
              · tap to adjust
            </button>
            <div className="flex gap-4">
              <button className="text-xs font-semibold uppercase tracking-widest text-[#d4b06a]">Save</button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-xs uppercase tracking-widest text-black/40 dark:text-slate-500"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div key={category.id} className="flex items-center justify-between gap-3 p-5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{category.name}</p>
              <p className="mt-1 truncate text-xs text-black/40 dark:text-slate-500">
                /{category.slug}
                {category.fields?.length ? ` · ${category.fields.length} custom fields` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setEditing(category.id);
                  setEditFields(category.fields ?? []);
                }}
                aria-label="Edit category"
                className={actionButton}
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                disabled={removePending}
                onClick={() =>
                  startRemove(async () => {
                    const result = await deleteCategory(category.id);
                    if (result.error) window.location.reload();
                  })
                }
                aria-label={`Delete ${category.name}`}
                className={`${actionButton} disabled:opacity-40`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ),
      )}
      {categories.length === 0 ? (
        <p className="p-12 text-center text-sm text-black/45 dark:text-slate-400">
          No categories yet — add your first one to organise the catalogue.
        </p>
      ) : null}
    </div>
  );
}