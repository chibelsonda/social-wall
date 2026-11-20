import type { SupabaseClient } from "@supabase/supabase-js";

export const WALL_PHOTOS_BUCKET = "wall-photos";
export const WALL_AVATARS_BUCKET = "wall-avatars";
export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
export const MAX_POST_PHOTOS = 5;

const PHOTO_EXTENSIONS: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const AVATAR_EXTENSIONS: Record<string, string> = {
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

export function validatePhotoSelection(files: File[], currentCount = 0): string | null {
  if (currentCount + files.length > MAX_POST_PHOTOS) {
    return `You can add up to ${MAX_POST_PHOTOS} photos per post.`;
  }

  for (const file of files) {
    const validationError = validatePhoto(file);
    if (validationError) return `${file.name}: ${validationError}`;
  }

  return null;
}

export function validateAvatar(file: File): string | null {
  if (!AVATAR_EXTENSIONS[file.type]) {
    return "Choose a JPG, PNG, or WebP profile photo.";
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return "Profile photos must be 2 MB or smaller.";
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

export async function uploadVisitorAvatar(client: SupabaseClient, file: File) {
  const extension = AVATAR_EXTENSIONS[file.type];
  const path = `visitors/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from(WALL_AVATARS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (error) throw error;

  const { data } = client.storage.from(WALL_AVATARS_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function removePostPhoto(client: SupabaseClient, path: string) {
  await client.storage.from(WALL_PHOTOS_BUCKET).remove([path]);
}

export async function removePostPhotos(client: SupabaseClient, paths: string[]) {
  if (paths.length === 0) return;
  await client.storage.from(WALL_PHOTOS_BUCKET).remove(paths);
}
