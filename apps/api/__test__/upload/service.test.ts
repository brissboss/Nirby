import { describe, expect, it } from "vitest";

import {
  generateKey,
  isValidMimeType,
  isValidAvatarSize,
  isValidPoiPhotoSize,
  ALLOWED_MIME_TYPES,
  MAX_AVATAR_SIZE,
  MAX_POI_PHOTO_SIZE,
} from "../../src/upload/service";

describe("Upload Service", () => {
  describe("generateKey", () => {
    it("should generate key with correct format for avatars", () => {
      const key = generateKey("avatars", "user123", "image/jpeg");

      expect(key).toMatch(/^avatars\/user123\/[a-f0-9-]+\.jpg$/);
    });

    it("should generate key with correct format for poi-photos", () => {
      const key = generateKey("poi-photos", "user456", "image/png");

      expect(key).toMatch(/^poi-photos\/user456\/[a-f0-9-]+\.png$/);
    });

    it("should generate key with webp extension", () => {
      const key = generateKey("avatars", "user789", "image/webp");

      expect(key).toMatch(/^avatars\/user789\/[a-f0-9-]+\.webp$/);
    });

    it("should generate unique keys", () => {
      const key1 = generateKey("avatars", "user123", "image/jpeg");
      const key2 = generateKey("avatars", "user123", "image/jpeg");

      expect(key1).not.toBe(key2);
    });

    it("should default to jpg for unknown mime type", () => {
      const key = generateKey("avatars", "user123", "image/unknown");

      expect(key).toMatch(/\.jpg$/);
    });
  });

  describe("isValidMimeType", () => {
    it("should return true for JPEG", () => {
      expect(isValidMimeType("image/jpeg")).toBe(true);
    });

    it("should return true for PNG", () => {
      expect(isValidMimeType("image/png")).toBe(true);
    });

    it("should return true for WebP", () => {
      expect(isValidMimeType("image/webp")).toBe(true);
    });

    it("should return false for GIF", () => {
      expect(isValidMimeType("image/gif")).toBe(false);
    });

    it("should return false for text/plain", () => {
      expect(isValidMimeType("text/plain")).toBe(false);
    });

    it("should return false for application/pdf", () => {
      expect(isValidMimeType("application/pdf")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isValidMimeType("")).toBe(false);
    });
  });

  describe("isValidAvatarSize", () => {
    it("should return true for size under 2MB", () => {
      expect(isValidAvatarSize(1 * 1024 * 1024)).toBe(true); // 1 MB
    });

    it("should return true for size exactly 2MB", () => {
      expect(isValidAvatarSize(2 * 1024 * 1024)).toBe(true); // 2 MB
    });

    it("should return false for size over 2MB", () => {
      expect(isValidAvatarSize(2.1 * 1024 * 1024)).toBe(false); // 2.1 MB
    });

    it("should return true for 0 bytes", () => {
      expect(isValidAvatarSize(0)).toBe(true);
    });
  });

  describe("isValidPoiPhotoSize", () => {
    it("should return true for size under 5MB", () => {
      expect(isValidPoiPhotoSize(3 * 1024 * 1024)).toBe(true); // 3 MB
    });

    it("should return true for size exactly 5MB", () => {
      expect(isValidPoiPhotoSize(5 * 1024 * 1024)).toBe(true); // 5 MB
    });

    it("should return false for size over 5MB", () => {
      expect(isValidPoiPhotoSize(5.1 * 1024 * 1024)).toBe(false); // 5.1 MB
    });

    it("should return true for 0 bytes", () => {
      expect(isValidPoiPhotoSize(0)).toBe(true);
    });
  });

  describe("Constants", () => {
    it("should have correct ALLOWED_MIME_TYPES", () => {
      expect(ALLOWED_MIME_TYPES).toEqual(["image/jpeg", "image/png", "image/webp"]);
    });

    it("should have correct MAX_AVATAR_SIZE (2MB)", () => {
      expect(MAX_AVATAR_SIZE).toBe(2 * 1024 * 1024);
    });

    it("should have correct MAX_POI_PHOTO_SIZE (5MB)", () => {
      expect(MAX_POI_PHOTO_SIZE).toBe(5 * 1024 * 1024);
    });
  });
});
