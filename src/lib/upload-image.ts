import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type MediaBucket = "products" | "categories";

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

type Client = SupabaseClient<Database>;

/**
 * Generate a collision-safe unique id that works in every environment.
 * `crypto.randomUUID()` is only available in secure contexts (HTTPS/localhost),
 * so browsers served over plain HTTP (e.g. LAN/ngrok testing) throw — this
 * falls back to Web Crypto random bytes, then to a Math.random suffix.
 */
function uniqueId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      // Format as a UUID-ish hex string.
      return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    // Some environments throw on crypto access — fall through to Math.random.
  }
  return `${Math.random().toString(36).substring(2, 15)}${Math.random()
    .toString(36)
    .substring(2, 15)}${Date.now().toString(36)}`;
}

/** Return a human-readable rejection reason, or null when the file is valid. */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `${file.name}: unsupported format (use PNG, JPG, WEBP, GIF or AVIF).`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name}: images must be under 5 MB.`;
  }
  return null;
}

/** Return a human-readable rejection reason, or null when the video is valid. */
export function validateVideoFile(file: File): string | null {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return `${file.name}: unsupported video format (use MP4, WEBM, OGG or MOV).`;
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return `${file.name}: videos must be under 100 MB.`;
  }
  return null;
}

/**
 * Upload an image straight to a public Supabase Storage bucket and resolve its
 * permanent public URL. Throws with a friendly message on any failure so server
 * actions can surface it directly to the admin UI.
 */
export async function uploadToBucket(
  client: Client,
  bucket: MediaBucket,
  file: File,
): Promise<string> {
  const problem = validateImageFile(file);
  if (problem) throw new Error(problem);

  const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const ext = rawExt.replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${Date.now()}-${uniqueId()}.${ext}`;

  const { error } = await client.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error(`Upload to "${bucket}" failed:`, error.message);
    throw new Error(`${file.name} could not be uploaded. Please retry.`);
  }

  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Same as uploadToBucket but for video files (larger cap, video mime types). */
export async function uploadVideoToBucket(
  client: Client,
  bucket: MediaBucket,
  file: File,
): Promise<string> {
  const problem = validateVideoFile(file);
  if (problem) throw new Error(problem);

  const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
  const ext = rawExt.replace(/[^a-z0-9]/g, "") || "mp4";
  const path = `${Date.now()}-${uniqueId()}.${ext}`;

  const { error } = await client.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error(`Video upload to "${bucket}" failed:`, error.message);
    throw new Error(`${file.name} could not be uploaded. Please retry.`);
  }

  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Best-effort reverse lookup of a storage path from one of our public URLs. */
export function pathFromUrl(bucket: MediaBucket, url: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  if (!url.includes(marker)) return null;
  return url.split(marker)[1]?.split("?")[0] ?? null;
}

/** Delete a batch of images from a bucket (silently skips foreign URLs). */
export async function removeFromBucket(
  client: Client,
  bucket: MediaBucket,
  urls: string[],
): Promise<void> {
  const paths = urls
    .map((url) => pathFromUrl(bucket, url))
    .filter((path): path is string => Boolean(path));
  if (paths.length === 0) return;
  try {
    await client.storage.from(bucket).remove(paths);
  } catch (error) {
    // Orphaned objects are harmless — never let cleanup break a request.
    console.warn(`Cleanup in "${bucket}" failed:`, error);
  }
}