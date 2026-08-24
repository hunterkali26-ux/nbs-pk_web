"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
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

export async function addProduct(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const title = formValue(formData, "title");
  const description = formValue(formData, "description");
  const category = formValue(formData, "category") as ProductInsert["category"];
  const price = Number(formValue(formData, "price"));
  const stock = Number(formValue(formData, "stock"));
  const image = formData.get("image");

  if (!title || !description || !category || !Number.isFinite(price) || !Number.isFinite(stock)) {
    return { error: "Complete every product field before saving." };
  }

  if (!category) return { error: "Choose a valid product category." };

  if (price < 0 || stock < 0 || !Number.isInteger(stock)) {
    return { error: "Price and stock must be valid positive values." };
  }

  if (!(image instanceof File) || image.size === 0) {
    return { error: "Choose a product image to upload." };
  }

  if (!image.type.startsWith("image/") || image.size > 5 * 1024 * 1024) {
    return { error: "Images must be under 5 MB and use a supported image format." };
  }

  let imagePath: string | undefined;

  try {
    const supabase = await requireAdmin();
    const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
    imagePath = `${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(imagePath, image, { contentType: image.type, upsert: false });

    if (uploadError) {
      console.error("Product image upload failed:", uploadError.message);
      return { error: "The image could not be uploaded. Check the storage bucket and try again." };
    }

    const { data: publicUrl } = supabase.storage
      .from("products")
      .getPublicUrl(imagePath);

    const product: ProductInsert = {
      title,
      description,
      price,
      category,
      stock,
      image_url: publicUrl.publicUrl,
    };

    const { error: dbError } = await supabase
      .from("products")
      .insert(product as never);
    console.error(dbError);

    if (dbError) {
      await supabase.storage.from("products").remove([imagePath]);
      return { error: "The product could not be saved. The uploaded image was removed." };
    }

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
      .select("image_url")
      .eq("id", productId)
      .maybeSingle();
    const product = productData as Pick<Product, "image_url"> | null;

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

    if (product?.image_url) {
      const marker = "/storage/v1/object/public/products/";
      const imagePath = product.image_url.split(marker)[1];
      if (imagePath) {
        await supabase.storage.from("products").remove([imagePath]);
      }
    }

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
  const price = Number(formValue(formData, "price"));
  const stock = Number(formValue(formData, "stock"));
  const image = formData.get("image");

  if (!id || !title || !description || !category || !Number.isFinite(price) || !Number.isInteger(stock) || price < 0 || stock < 0) {
    return { error: "Enter valid product details before saving." };
  }

  try {
    const supabase = await requireAdmin();
    let imageUrl: string | undefined;
    let imagePath: string | undefined;
    if (image instanceof File && image.size > 0) {
      if (!image.type.startsWith("image/") || image.size > 5 * 1024 * 1024) return { error: "Images must be under 5 MB." };
      imagePath = `${crypto.randomUUID()}.${image.name.split(".").pop()?.toLowerCase() || "jpg"}`;
      const { error } = await supabase.storage.from("products").upload(imagePath, image, { contentType: image.type });
      if (error) return { error: "The replacement image could not be uploaded." };
      imageUrl = supabase.storage.from("products").getPublicUrl(imagePath).data.publicUrl;
    }

    const update: Record<string, unknown> = { title, description, category, price, stock };
    if (imageUrl) update.image_url = imageUrl;
    const { error: dbError } = await supabase.from("products").update(update as never).eq("id", id);
    console.error(dbError);
    if (dbError) {
      if (imagePath) await supabase.storage.from("products").remove([imagePath]);
      return { error: "The product could not be updated." };
    }
    revalidatePath("/admin");
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
  try {
    const supabase = await requireAdmin();
    const payload: CategoryInsert = { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") };
    const { error: dbError } = await supabase.from("categories").insert(payload as never);
    console.error(dbError);
    if (dbError) return { error: "The category could not be added." };
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
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("categories").update({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") } as never).eq("id", id);
    if (error) return { error: "The category could not be updated." };
    revalidatePath("/admin/categories"); revalidatePath("/admin/products");
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