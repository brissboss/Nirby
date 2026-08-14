import * as z from "zod";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_POI_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

function imageFileSchema(maxSize: number) {
  return z
    .instanceof(File, {
      message: "upload.invalidMimeType",
    })
    .refine((file) => file.size > 0, {
      message: "upload.fileEmpty",
    })
    .refine((file) => file.size <= maxSize, {
      message: "upload.fileTooLarge",
    })
    .refine((file) => ALLOWED_MIME_TYPES.includes(file.type), {
      message: "upload.invalidMimeType",
    });
}

export const avatarFileSchema = imageFileSchema(MAX_AVATAR_SIZE);

export const poiPhotoFileSchema = imageFileSchema(MAX_POI_PHOTO_SIZE);
