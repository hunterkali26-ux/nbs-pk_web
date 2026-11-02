"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { resolveCategoryFields } from "@/lib/product-attributes";
import { removeFromBucket, uploadToBucket, uploadVideoToBucket } from "@/lib/upload-image";
import { uploadToBlob, removeFromBlob } from "@/lib/blob-upload";
import type { CategoryInsert, Product, ProductInsert, Profile } from "@/types/database";

export type ProductActionState = {
  error?: string;
  success?: string;
};

async function requireAdmin() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Unauthorized");
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  const profile = profileData as Pick<Profile, "role"> | null;

  if (profileError || profile?.role !== "admin") {
    throw new Error("Forbidden");
  }

  return supabase;
}

const formValue = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

/**
 * Parse a JSON string-array field posted by the client-side direct uploader.
 * Returns null when the field is absent/unparseable so callers can fall back
 * to the legacy raw-file upload path.
 */
function parseUrlList(value: FormDataEntryValue | null): string[] | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
  } catch {
    return null;
  }
}

export async function addProduct(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const title = formValue(formData, "title");
  const description = formValue(formData, "description");
  const category = formValue(formData, "category");
  const brand = formValue(formData, "brand");
  const colorFamily = formValue(formData, "color_family");
  const price = Number(formValue(formData, "price"));
  const rawOriginalPrice = formValue(formData, "original_price");
  const originalPrice = rawOriginalPrice ? Number(rawOriginalPrice) : Number.NaN;
  const stock = Number(formValue(formData, "stock"));

  if (!title || !category || !Number.isFinite(price) || !Number.isInteger(stock)) {
    return { error: "Complete every required product field before saving." };
  }

  if (price < 0 || stock < 0 || (Number.isFinite(originalPrice) && originalPrice < 0)) {
    return { error: "Prices and quantity must be valid non-negative values." };
  }

  // Every selected photo uploads straight to the products bucket; the first
  // one becomes the storefront cover image.
  const imageFiles = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  const videoFiles = formData
    .getAll("videos")
    .filter((value): value is File => value instanceof File && value.size > 0);

  // Fast path: the admin form uploads media to Storage from the browser and
  // posts only the resulting public URLs, keeping the action payload tiny.
  const preUploadedImages = parseUrlList(formData.get("uploaded_images"));
  const preUploadedVideos = parseUrlList(formData.get("uploaded_videos"));

  if (imageFiles.length === 0 && preUploadedImages === null) {
    return { error: "Upload at least one product image." };
  }

  try {
    const supabase = await requireAdmin();

    const images: string[] = [];
    if (preUploadedImages !== null) {
      images.push(...preUploadedImages);
    } else {
      for (const file of imageFiles) {
        try {
          images.push(await uploadToBucket(supabase, "products", file));
        } catch (uploadError) {
          // Roll back anything already uploaded so no orphaned objects linger.
          await removeFromBucket(supabase, "products", images);
          console.error("Product image upload failed:", uploadError);
          return {
            error:
              uploadError instanceof Error
                ? uploadError.message
                : "An image could not be uploaded.",
          };
        }
      }
    }

    const videos: string[] = [];
    if (preUploadedVideos !== null) {
      videos.push(...preUploadedVideos);
    } else {
      for (const file of videoFiles) {
        try {
          videos.push(await uploadVideoToBucket(supabase, "products", file));
        } catch (uploadError) {
          await removeFromBucket(supabase, "products", [...images, ...videos]);
          console.error("Product video upload failed:", uploadError);
          return {
            error:
              uploadError instanceof Error
                ? uploadError.message
                : "A video could not be uploaded.",
          };
        }
      }
    }

    // Build dynamic specs from the category's enabled custom fields.
    const { data: categoryRows } = await supabase
      .from("categories")
      .select("name, fields")
      .eq("name", category)
      .maybeSingle();
    const fieldDefs = resolveCategoryFields(
      (categoryRows as { name: string; fields?: string[] | null } | null) ?? {
        name: category,
      },
    );

    const specs = fieldDefs
      .map((def) => ({
        key: def.key,
        label: def.label,
        value: formValue(formData, `spec_${def.key}`),
      }))
      .filter((spec) => Boolean(spec.value));

    const product: ProductInsert = {
      title,
      description,
      price,
      category,
      stock,
      brand: brand || null,
      original_price:
        Number.isFinite(originalPrice) && originalPrice > 0 ? originalPrice : null,
      color_family: colorFamily || null,
      images,
      videos,
      specs,
      image_url: images[0],
    };

    const { error: dbError } = await supabase
      .from("products")
      .insert(product as never);
    console.error(dbError);

    if (dbError) {
      return { error: "The product could not be saved." };
    }

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/categories");
    revalidatePath("/admin");
    revalidatePath("/admin/products");
    return { success: "Product added to inventory." };
  } catch (error) {
    console.error("Admin product action failed:", error);
    return { error: "You are not authorized to manage products." };
  }
}

export async function deleteProduct(productId: string): Promise<ProductActionState> {
  if (!productId) {
    return { error: "Product not found." };
  }

  try {
    const supabase = await requireAdmin();
    const { data: productData, error: productLookupError } = await supabase
      .from("products")
      .select("image_url, images, videos")
      .eq("id", productId)
      .maybeSingle();
    const product = productData as Pick<Product, "image_url" | "images" | "videos"> | null;

    if (productLookupError) {
      return { error: "The product could not be found." };
    }

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (deleteError) {
      console.error("Product delete failed:", deleteError.message);
      return { error: "The product could not be deleted." };
    }

    // Remove every stored photo + video that belonged to this product.
    await removeFromBucket(supabase, "products", [
      ...(product?.images ?? []),
      ...(product?.videos ?? []),
      ...(product?.image_url ? [product.image_url] : []),
    ]);

    revalidatePath("/admin");
    return { success: "Product deleted." };
  } catch (error) {
    console.error("Admin product delete failed:", error);
    return { error: "You are not authorized to manage products." };
  }
}

export async function updateProduct(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const id = formValue(formData, "id");
  const title = formValue(formData, "title");
  const description = formValue(formData, "description");
  const category = formValue(formData, "category");
  const brand = formValue(formData, "brand");
  const colorFamily = formValue(formData, "color_family");
  const price = Number(formValue(formData, "price"));
  const rawOriginalPrice = formValue(formData, "original_price");
  const originalPrice = rawOriginalPrice ? Number(rawOriginalPrice) : Number.NaN;
  const stock = Number(formValue(formData, "stock"));

  if (!id || !title || !category || !Number.isFinite(price) || !Number.isInteger(stock) || price < 0 || stock < 0) {
    return { error: "Enter valid product details before saving." };
  }

  try {
    const supabase = await requireAdmin();

    // Rebuild dynamic specs from the category's enabled custom fields.
    const { data: categoryRows } = await supabase
      .from("categories")
      .select("name, fields")
      .eq("name", category)
      .maybeSingle();
    const fieldDefs = resolveCategoryFields(
      (categoryRows as { name: string; fields?: string[] | null } | null) ?? {
        name: category,
      },
    );

    const specs = fieldDefs
      .map((def) => ({
        key: def.key,
        label: def.label,
        value: formValue(formData, `spec_${def.key}`),
      }))
      .filter((spec) => Boolean(spec.value));

    // Gallery handling: hidden inputs carry surviving URLs, while any newly
    // picked files upload straight to storage and append to the gallery.
    const keepImages = formData
      .getAll("keep_images")
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);

    const newFiles = formData
      .getAll("new_images")
      .filter((value): value is File => value instanceof File && value.size > 0);

    // Video gallery: surviving URLs via hidden inputs + newly picked files.
    const keepVideos = formData
      .getAll("keep_videos")
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);

    const newVideoFiles = formData
      .getAll("new_videos")
      .filter((value): value is File => value instanceof File && value.size > 0);

    // Fast path: the admin form uploads new media to Storage from the browser
    // and posts only the resulting public URLs (tiny action payload).
    const preUploadedImages = parseUrlList(formData.get("uploaded_images"));
    const preUploadedVideos = parseUrlList(formData.get("uploaded_videos"));

    const newImages: string[] = [];
    if (preUploadedImages !== null) {
      newImages.push(...preUploadedImages);
    } else {
      for (const file of newFiles) {
        try {
          newImages.push(await uploadToBucket(supabase, "products", file));
        } catch (uploadError) {
          await removeFromBucket(supabase, "products", newImages);
          console.error("Product image upload failed:", uploadError);
          return {
            error:
              uploadError instanceof Error
                ? uploadError.message
                : "An image could not be uploaded.",
          };
        }
      }
    }

    const images = [...keepImages, ...newImages];

    const newVideos: string[] = [];
    if (preUploadedVideos !== null) {
      newVideos.push(...preUploadedVideos);
    } else {
      for (const file of newVideoFiles) {
        try {
          newVideos.push(await uploadVideoToBucket(supabase, "products", file));
        } catch (uploadError) {
          await removeFromBucket(supabase, "products", newVideos);
          console.error("Product video upload failed:", uploadError);
          return {
            error:
              uploadError instanceof Error
                ? uploadError.message
                : "A video could not be uploaded.",
          };
        }
      }
    }

    const videos = [...keepVideos, ...newVideos];

    const update: Record<string, unknown> = {
      title,
      description: description || null,
      category,
      price,
      stock,
      brand: brand || null,
      original_price:
        Number.isFinite(originalPrice) && originalPrice > 0 ? originalPrice : null,
      color_family: colorFamily || null,
      specs,
    };

    // Only rewrite the gallery when something survived / was added.
    let rewroteGallery = false;
    if (images.length > 0) {
      update.images = images;
      update.image_url = images[0];
      rewroteGallery = true;
    }
    if (videos.length > 0) {
      update.videos = videos;
    }

    const { error: dbError } = await supabase
      .from("products")
      .update(update as never)
      .eq("id", id);
    console.error(dbError);

    if (dbError) {
      return { error: "The product could not be updated." };
    }

    // Best-effort storage cleanup for photos the admin removed from the set.
    if (rewroteGallery) {
      const { data: existingRow } = await supabase
        .from("products")
        .select("images")
        .eq("id", id)
        .maybeSingle();
      const existingImages = (
        (existingRow as { images?: string[] | null } | null)?.images ?? []
      ) as string[];
      const removedImages = existingImages.filter((url) => !images.includes(url));
      await removeFromBucket(
        supabase,
        "products",
        removedImages,
      );
      // Also clean up Vercel Blob images
      await removeFromBlob(removedImages);
    }

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/categories");
    revalidatePath("/admin");
    revalidatePath(`/products/${id}`);
    revalidatePath("/admin/products");
    return { success: "Product updated." };
  } catch (error) {
    console.error("Admin product update failed:", error);
    return { error: "You are not authorized to manage products." };
  }
}

export async function addCategory(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const name = formValue(formData, "name");
  if (!name) return { error: "Enter a category name." };

  // Checkbox modal selection — the custom input fields enabled for products
  // that belong to this category.
  const fields = formData
    .getAll("fields")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  try {
    const supabase = await requireAdmin();

    // Optional cover photo uploads straight to the categories bucket.
    let imageUrl: string | null = null;
    const image = formData.get("image");
    if (image instanceof File && image.size > 0) {
      try {
        imageUrl = (await uploadToBlob(image, "categories")).url;
      } catch (uploadError) {
        console.error("Category image upload failed:", uploadError);
        return {
          error:
            uploadError instanceof Error
              ? uploadError.message
              : "The category image could not be uploaded.",
        };
      }
    }

    const payload: CategoryInsert = {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      fields,
      image_url: imageUrl,
    };
    const { error: dbError } = await supabase.from("categories").insert(payload as never);
    console.error(dbError);
    if (dbError) return { error: "The category could not be added." };
    revalidatePath("/");
    revalidatePath("/categories");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    return { success: "Category added." };
  } catch (error) {
    console.error("Category insert failed:", error);
    return { error: "You are not authorized to manage categories." };
  }
}

export async function updateCategory(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const id = formValue(formData, "id");
  const name = formValue(formData, "name");
  if (!id || !name) return { error: "Enter a category name." };

  const fields = formData
    .getAll("fields")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  try {
    const supabase = await requireAdmin();

    // Upload a replacement cover when one was picked; otherwise keep the old.
    let imageUrl: string | null | undefined;
    const image = formData.get("image");
    if (image instanceof File && image.size > 0) {
      try {
        imageUrl = (await uploadToBlob(image, "categories")).url;
      } catch (uploadError) {
        console.error("Category image upload failed:", uploadError);
        return {
          error:
            uploadError instanceof Error
              ? uploadError.message
              : "The category image could not be uploaded.",
        };
      }
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    if (imageUrl) {
      // Remember the previous cover so it can be removed after a clean save.
      const { data: existingRow } = await supabase
        .from("categories")
        .select("image_url")
        .eq("id", id)
        .maybeSingle();
      const oldImage =
        (existingRow as { image_url: string | null } | null)?.image_url ?? null;

      const payload = { name, slug, fields, image_url: imageUrl };
      const { error } = await supabase.from("categories").update(payload as never).eq("id", id);
      if (error) {
        await removeFromBlob([imageUrl]);
        return { error: "The category could not be updated." };
      }
      if (oldImage && oldImage !== imageUrl) {
        await removeFromBlob([oldImage]);
      }
    } else {
      const payload = { name, slug, fields };
      const { error } = await supabase.from("categories").update(payload as never).eq("id", id);
      if (error) return { error: "The category could not be updated." };
    }

    revalidatePath("/");
    revalidatePath("/categories");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    return { success: "Category updated." };
  } catch { return { error: "You are not authorized to manage categories." }; }
}

export async function deleteCategory(id: string): Promise<ProductActionState> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return { error: "The category could not be deleted." };
    revalidatePath("/admin/categories"); revalidatePath("/admin/products");
    return { success: "Category deleted." };
  } catch { return { error: "You are not authorized to manage categories." }; }
}

export async function updateOrderStatus(orderId: string, status: string): Promise<ProductActionState> {
  const normalized = ["pending", "shipped", "delivered", "cancelled"].includes(status) ? status : null;
  if (!normalized) return { error: "Invalid order status." };
  try {
    const supabase = await requireAdmin();

    // The live orders table has NO updated_at column, and a touch-trigger on
    // it is broken (42703: record "new" has no field "updated_at"). NEVER send
    // updated_at in the payload — only ever { status } — and fall back between
    // lowercase / Title-case to satisfy whatever CHECK constraint exists.
    let lastMessage = "unknown error";
    const titleCase = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    const attempts: { status: string }[] = [
      { status: normalized },
      { status: titleCase },
    ];
    for (const payload of attempts) {
      const { error } = await supabase
        .from("orders")
        .update(payload as never)
        .eq("id", orderId);
      if (!error) {
        return { success: `Order marked ${payload.status}.` };
      }
      lastMessage = `${error.code ?? ""} ${error.message}`.trim();
      console.error("Order status update failed:", {
        payload,
        lastMessage,
        hint:
          lastMessage.includes("updated_at")
            ? "A broken trigger on the orders table references a missing updated_at column — drop or recreate that trigger in the Supabase SQL Editor."
            : undefined,
      });
    }
    return { error: `The order status could not be saved (${lastMessage}).` };
  } catch {
    return { error: "You are not authorized to manage orders." };
  }
}

/**
 * Permanently remove an order and all of its lines. Admin-only; customers have
 * no delete path (their history page only hides rows locally).
 */
export async function deleteOrder(orderId: string): Promise<ProductActionState> {
  if (!orderId) return { error: "Order not found." };
  try {
    const supabase = await requireAdmin();
    // Lines first, then the parent — keeps the DB consistent even if the FK
    // lacks an ON DELETE cascade in the live schema.
    const { error: itemsError } = await supabase.from("order_items").delete().eq("order_id", orderId);
    if (itemsError) return { error: "The order items could not be deleted." };
    const { error: orderError } = await supabase.from("orders").delete().eq("id", orderId);
    if (orderError) return { error: "The order could not be deleted." };
    revalidatePath("/admin/orders");
    revalidatePath("/account/orders");
    revalidatePath("/admin");
    return { success: "Order deleted permanently." };
  } catch {
    return { error: "You are not authorized to manage orders." };
  }
}

/**
 * Admin-only full edit of an order's parcel details AND status. Unlike the
 * customer path there is NO status gate — every state transition stays
 * available regardless of whether the order is pending, shipped, delivered or
 * cancelled. requireAdmin() throws unless the caller has profiles.role=admin.
 */
export async function updateOrderAsAdmin(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const orderId = formValue(formData, "order_id");
  const statusRaw = formValue(formData, "status");
  const normalized = ["pending", "shipped", "delivered", "cancelled"].includes(statusRaw)
    ? statusRaw.toLowerCase()
    : null;

  if (!orderId) return { error: "Order not found." };

  const payload = {
    customer_name: formValue(formData, "customer_name"),
    customer_phone: formValue(formData, "customer_phone"),
    shipping_address: formValue(formData, "shipping_address"),
    city: formValue(formData, "city"),
    notes: formValue(formData, "notes"),
    near_landmark: formValue(formData, "near_landmark"),
    tracking_number: formValue(formData, "tracking_number"),
  };

  if (!payload.customer_name || !payload.customer_phone || !payload.shipping_address || !payload.city) {
    return { error: "Customer name, phone, address and city are required." };
  }

  try {
    const supabase = await requireAdmin();

    // Same lowercase→Title-case fallback dance as updateOrderStatus: the live
    // orders table carries a CHECK constraint sensitive to casing, and NEVER
    // accepts updated_at (broken trigger on the live schema).
    let lastMessage = "unknown error";
    if (normalized) {
      const titleCase = normalized.charAt(0).toUpperCase() + normalized.slice(1);
      const attempts = [
        { ...payload, status: normalized },
        { ...payload, status: titleCase },
      ];
      for (const attempt of attempts) {
        const { error } = await supabase
          .from("orders")
          .update(attempt as never)
          .eq("id", orderId);
        if (!error) {
          revalidatePath("/admin/orders");
          revalidatePath("/account/orders");
          revalidatePath("/admin");
          return { success: `Order saved (${attempt.status}).` };
        }
        lastMessage = `${error.code ?? ""} ${error.message}`.trim();
      }
    } else {
      // Status unchanged / unrecognized — save details only.
      const { error } = await supabase
        .from("orders")
        .update(payload as never)
        .eq("id", orderId);
      if (error) lastMessage = `${error.code ?? ""} ${error.message}`.trim();
      else {
        revalidatePath("/admin/orders");
        revalidatePath("/account/orders");
        revalidatePath("/admin");
        return { success: "Order details saved." };
      }
    }

    return { error: `The order could not be saved (${lastMessage}).` };
  } catch {
    return { error: "You are not authorized to manage orders." };
  }
}