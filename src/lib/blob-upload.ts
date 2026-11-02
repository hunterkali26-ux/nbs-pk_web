"use server";

import { put, del } from "@vercel/blob";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB per image
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB per video
const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
];
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-m4v",
];

function uniqueId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    // Fall through to Math.random fallback.
  }
  return `${Math.random().toString(36).substring(2, 15)}${Math.random()
    .toString(36)
    .substring(2, 15)}${Date.now().toString(36)}`;
}

export type BlobUploadResult = {
  url: string;
  pathname: string;
  contentType: string;
};

/**
 * Upload a file (image) to Vercel Blob storage and return the public URL.
 * This runs on the server side and uses the BLOB_READ_WRITE_TOKEN env var.
 */
export async function uploadToBlob(
  file: File,
  folder: string = "products"
): Promise<BlobUploadResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      `${file.name}: unsupported format (use PNG, JPG, WEBP, GIF or AVIF).`
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`${file.name}: images must be under 5 MB.`);
  }

  const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const ext = rawExt.replace(/[^a-z0-9]/g, "") || "jpg";
  const pathname = `${folder}/${Date.now()}-${uniqueId()}.${ext}`;

  const blob = await put(pathname, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: false,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: blob.contentType,
  };
}

/**
 * Upload a video file to Vercel Blob storage and return the public URL.
 */
export async function uploadVideoToBlob(
  file: File,
  folder: string = "products"
): Promise<BlobUploadResult> {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    throw new Error(
      `${file.name}: unsupported video format (use MP4, WEBM, OGG or MOV).`
    );
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(`${file.name}: videos must be under 100 MB.`);
  }

  const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
  const ext = rawExt.replace(/[^a-z0-9]/g, "") || "mp4";
  const pathname = `${folder}/${Date.now()}-${uniqueId()}.${ext}`;

  const blob = await put(pathname, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: false,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: blob.contentType,
  };
}

/**
 * Upload multiple files (images or videos) to Vercel Blob in parallel.
 */
export async function uploadMultipleToBlob(
  files: File[],
  folder: string = "products",
  isVideo: boolean = false
): Promise<BlobUploadResult[]> {
  const uploadFn = isVideo ? uploadVideoToBlob : uploadToBlob;
  const results = await Promise.all(
    files.map((file) => uploadFn(file, folder))
  );
  return results;
}

/**
 * Validate an image file before uploading.
 */
export async function validateImageFile(file: File): Promise<string | null> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `${file.name}: unsupported format (use PNG, JPG, WEBP, GIF or AVIF).`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name}: images must be under 5 MB.`;
  }
  return null;
}

/**
 * Delete a file from Vercel Blob by its URL.
 * Silently skips URLs that don't belong to Vercel Blob.
 */
export async function removeFromBlob(urls: string[]): Promise<void> {
  const blobUrls = urls.filter((url) => url.includes("vercel-storage.com"));
  if (blobUrls.length === 0) return;
  try {
    await del(blobUrls);
  } catch (error) {
    // Orphaned objects are harmless — never let cleanup break a request.
    console.warn("Cleanup from Vercel Blob failed:", error);
  }
}
export async function validateVideoFile(file: File): Promise<string | null> {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return `${file.name}: unsupported video format (use MP4, WEBM, OGG or MOV).`;
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return `${file.name}: videos must be under 100 MB.`;
  }
  return null;
}