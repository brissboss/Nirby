import { randomUUID } from "crypto";

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

import { env } from "../env";

const s3 = new S3Client({
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  ...(env.S3_ENDPOINT && {
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: true, // Required for MinIO
  }),
});

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
export const MAX_POI_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Get the file extension from a MIME type
 */
function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  return map[mimeType] || "jpg";
}

/**
 * Generate a unique S3 key for a file
 */
export function generateKey(
  folder: "avatars" | "poi-photos",
  userId: string,
  mimeType: string
): string {
  const uuid = randomUUID();
  const ext = getExtensionFromMime(mimeType);
  return `${folder}/${userId}/${uuid}.${ext}`;
}

/**
 * Get the public URL for an S3 object
 */
function getPublicUrl(key: string): string {
  // Use custom public URL if configured (CDN, custom domain)
  if (env.S3_PUBLIC_URL) {
    return `${env.S3_PUBLIC_URL}/${key}`;
  }

  // For MinIO endpoints (dev)
  if (env.S3_ENDPOINT) {
    return `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`;
  }

  // Default AWS S3 URL
  return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
}

/**
 * Extract the S3 key from a public URL
 */
function getKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);

    const pathname = urlObj.pathname;

    const key = pathname.startsWith(`/${env.S3_BUCKET}/`)
      ? pathname.slice(`/${env.S3_BUCKET}/`.length)
      : pathname.slice(1);

    return key || null;
  } catch {
    return null;
  }
}

/**
 * Upload a file to S3 and return the public URL
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3.send(command);

  return getPublicUrl(key);
}

/**
 * Delete a file from S3 by its URL or key
 */
export async function deleteFile(keyOrUrl: string): Promise<void> {
  const key = keyOrUrl.startsWith("http") ? getKeyFromUrl(keyOrUrl) : keyOrUrl;

  if (!key) {
    return;
  }

  const command = new DeleteObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  });

  await s3.send(command);
}

/**
 * Validate file type
 */
export function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Validate file size for avatar
 */
export function isValidAvatarSize(size: number): boolean {
  return size <= MAX_AVATAR_SIZE;
}

/**
 * Validate file size for POI photo
 */
export function isValidPoiPhotoSize(size: number): boolean {
  return size <= MAX_POI_PHOTO_SIZE;
}
