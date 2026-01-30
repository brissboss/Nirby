import * as z from "zod";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

export const avatarFileSchema = z
  .instanceof(File, {
    message: "upload.invalidMimeType",
  })
  .refine((file) => file.size > 0, {
    message: "upload.fileEmpty",
  })
  .refine((file) => file.size <= MAX_AVATAR_SIZE, {
    message: "upload.fileTooLarge",
  })
  .refine((file) => ALLOWED_MIME_TYPES.includes(file.type), {
    message: "upload.invalidMimeType",
  });
