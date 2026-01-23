import { describe, it, expect } from "vitest";

import { avatarFileSchema } from "@/schemas/upload.schema";

describe("avatarFileSchema", () => {
  it("should validate a valid JPEG file under 2MB", () => {
    const file = new File(["test content"], "test.jpg", {
      type: "image/jpeg",
    });

    // Mock file.size to be less than 2MB
    Object.defineProperty(file, "size", {
      value: 1024 * 1024, // 1MB
      writable: false,
    });
    const result = avatarFileSchema.safeParse(file);
    expect(result.success).toBe(true);
  });

  it("should validate a valid PNG file under 2MB", () => {
    const file = new File(["test content"], "test.png", {
      type: "image/png",
    });

    Object.defineProperty(file, "size", {
      value: 1024 * 1024, // 1MB
      writable: false,
    });
    const result = avatarFileSchema.safeParse(file);
    expect(result.success).toBe(true);
  });

  it("should validate a valid WebP file under 2MB", () => {
    const file = new File(["test content"], "test.webp", {
      type: "image/webp",
    });

    Object.defineProperty(file, "size", {
      value: 1024 * 1024, // 1MB
      writable: false,
    });
    const result = avatarFileSchema.safeParse(file);
    expect(result.success).toBe(true);
  });

  it("should reject a file larger than 2MB", () => {
    const file = new File(["test content"], "test.jpg", {
      type: "image/jpeg",
    });

    Object.defineProperty(file, "size", {
      value: 2 * 1024 * 1024 + 1, // 2MB + 1 byte
      writable: false,
    });
    const result = avatarFileSchema.safeParse(file);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("upload.fileTooLarge");
    }
  });

  it("should reject an empty file (size = 0)", () => {
    const file = new File([], "test.jpg", {
      type: "image/jpeg",
    });

    Object.defineProperty(file, "size", {
      value: 0,
      writable: false,
    });
    const result = avatarFileSchema.safeParse(file);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("upload.fileEmpty");
    }
  });

  it("should reject an invalid MIME type (e.g., PDF)", () => {
    const file = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });

    Object.defineProperty(file, "size", {
      value: 1024 * 1024, // 1MB
      writable: false,
    });
    const result = avatarFileSchema.safeParse(file);
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
