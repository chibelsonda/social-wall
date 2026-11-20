import type { SupabaseClient } from "@supabase/supabase-js";

export const WALL_PHOTOS_BUCKET = "wall-photos";
export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const PHOTO_EXTENSIONS: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validatePhoto(file: File): string | null {
  if (!PHOTO_EXTENSIONS[file.type]) {
    return "Choose a JPG, PNG, WebP, or GIF image.";
  }

  if (file.size > MAX_PHOTO_SIZE) {
    return "Photos must be 5 MB or smaller.";
  }

  return null;
}

export async function uploadPostPhoto(client: SupabaseClient, file: File) {
  const extension = PHOTO_EXTENSIONS[file.type];
  const path = `posts/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from(WALL_PHOTOS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (error) throw error;

  const { data } = client.storage.from(WALL_PHOTOS_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function removePostPhoto(client: SupabaseClient, path: string) {
  await client.storage.from(WALL_PHOTOS_BUCKET).remove([path]);
}
