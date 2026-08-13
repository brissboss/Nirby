import { describe, it, expect } from "vitest";

import { avatarFileSchema, poiPhotoFileSchema } from "@/features/upload";

function imageFile(type: string, size: number, name = "test.jpg") {
  const file = new File(["test content"], name, { type });
  Object.defineProperty(file, "size", {
    value: size,
    writable: false,
  });
  return file;
}

describe("avatarFileSchema", () => {
  it("should validate a valid JPEG file under 2MB", () => {
    const result = avatarFileSchema.safeParse(imageFile("image/jpeg", 1024 * 1024));
    expect(result.success).toBe(true);
  });

  it("should validate a valid PNG file under 2MB", () => {
    const result = avatarFileSchema.safeParse(imageFile("image/png", 1024 * 1024, "test.png"));
    expect(result.success).toBe(true);
  });

  it("should validate a valid WebP file under 2MB", () => {
    const result = avatarFileSchema.safeParse(imageFile("image/webp", 1024 * 1024, "test.webp"));
    expect(result.success).toBe(true);
  });

  it("should reject a file larger than 2MB", () => {
    const result = avatarFileSchema.safeParse(imageFile("image/jpeg", 2 * 1024 * 1024 + 1));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("upload.fileTooLarge");
    }
  });

  it("should reject an empty file (size = 0)", () => {
    const result = avatarFileSchema.safeParse(imageFile("image/jpeg", 0));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("upload.fileEmpty");
    }
  });

  it("should reject an invalid MIME type (e.g., PDF)", () => {
    const result = avatarFileSchema.safeParse(
      imageFile("application/pdf", 1024 * 1024, "test.pdf")
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("upload.invalidMimeType");
    }
  });

  it("should reject a non-File object", () => {
    const notAFile = {
      name: "test.jpg",
      type: "image/jpeg",
      size: 1024,
    };

    const result = avatarFileSchema.safeParse(notAFile);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("upload.invalidMimeType");
    }
  });
});

describe("poiPhotoFileSchema", () => {
  it("should accept a JPEG under 5MB", () => {
    const result = poiPhotoFileSchema.safeParse(imageFile("image/jpeg", 3 * 1024 * 1024));
    expect(result.success).toBe(true);
  });

  it("should accept a file at the 5MB limit", () => {
    const result = poiPhotoFileSchema.safeParse(
      imageFile("image/webp", 5 * 1024 * 1024, "spot.webp")
    );
    expect(result.success).toBe(true);
  });

  it("should reject a file larger than 5MB", () => {
    const result = poiPhotoFileSchema.safeParse(imageFile("image/jpeg", 5 * 1024 * 1024 + 1));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("upload.fileTooLarge");
    }
  });
});
