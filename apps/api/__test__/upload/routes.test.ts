import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import path from "path";
import fs from "fs";

import { createServer } from "../../src/server";
import { prisma } from "../../src/db";
import { hashPassword } from "../../src/auth/hash";
import { signAccessToken } from "../../src/auth/token";

// Mock the upload service to avoid actual S3 calls
vi.mock("../../src/upload/service", async () => {
  const actual = await vi.importActual("../../src/upload/service");
  return {
    ...actual,
    uploadFile: vi.fn().mockResolvedValue("https://s3.example.com/test-file.jpg"),
    deleteFile: vi.fn().mockResolvedValue(undefined),
  };
});

import { uploadFile, deleteFile } from "../../src/upload/service";

const app = createServer();

// Create a small valid JPEG buffer (1x1 pixel)
const createValidJpegBuffer = (): Buffer => {
  // Minimal valid JPEG (1x1 red pixel)
  return Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
    0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
    0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
    0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
    0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d, 0x01, 0x02, 0x03, 0x00,
    0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32,
    0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35,
    0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55,
    0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
    0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94,
    0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2,
    0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
    0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6,
    0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda,
    0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xfb, 0xd5, 0xdb, 0x20, 0xa8, 0xf1, 0x45, 0x00,
    0xff, 0xd9,
  ]);
};

// Create a PNG buffer
const createValidPngBuffer = (): Buffer => {
  // Minimal valid PNG (1x1 red pixel)
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xfe, 0xd4, 0xef, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
    0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
};

describe("Upload Routes", () => {
  let userId: string;
  let accessToken: string;

  beforeAll(async () => {
    await prisma.savedPoi.deleteMany();
    await prisma.poiList.deleteMany();
    await prisma.poi.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: "test-upload@example.com",
        passwordHash: await hashPassword("password123"),
        emailVerified: true,
      },
    });

    userId = user.id;
    accessToken = signAccessToken({ userId: user.id, email: user.email });
  });

  afterAll(async () => {
    await prisma.savedPoi.deleteMany();
    await prisma.poiList.deleteMany();
    await prisma.poi.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset user avatar
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });

    // Delete all POIs
    await prisma.poi.deleteMany();
  });

  describe("POST /upload/avatar", () => {
    it("should upload avatar successfully", async () => {
      const res = await request(app)
        .post("/upload/avatar")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", createValidJpegBuffer(), "avatar.jpg");

      expect(res.status).toBe(200);
      expect(res.body.url).toBeDefined();
      expect(res.body.url).toBe("https://s3.example.com/test-file.jpg");

      // Verify uploadFile was called
      expect(uploadFile).toHaveBeenCalledTimes(1);

      // Verify user avatarUrl was updated
      const user = await prisma.user.findUnique({ where: { id: userId } });
      expect(user?.avatarUrl).toBe("https://s3.example.com/test-file.jpg");
    });

    it("should upload PNG avatar successfully", async () => {
      const res = await request(app)
        .post("/upload/avatar")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", createValidPngBuffer(), "avatar.png");

      expect(res.status).toBe(200);
      expect(res.body.url).toBeDefined();
    });

    it("should delete old avatar when uploading new one", async () => {
      // Set existing avatar
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: "https://s3.example.com/old-avatar.jpg" },
      });

      const res = await request(app)
        .post("/upload/avatar")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", createValidJpegBuffer(), "avatar.jpg");

      expect(res.status).toBe(200);

      // Verify deleteFile was called with old URL
      expect(deleteFile).toHaveBeenCalledWith("https://s3.example.com/old-avatar.jpg");
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .post("/upload/avatar")
        .attach("file", createValidJpegBuffer(), "avatar.jpg");

      expect(res.status).toBe(401);
    });

    it("should fail without file", async () => {
      const res = await request(app)
        .post("/upload/avatar")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("UPLOAD_FILE_REQUIRED");
    });

    it("should fail with invalid file type", async () => {
      const res = await request(app)
        .post("/upload/avatar")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", Buffer.from("not an image"), {
          filename: "test.txt",
          contentType: "text/plain",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("UPLOAD_INVALID_FILE_TYPE");
    });

    it("should fail with GIF file type", async () => {
      const res = await request(app)
        .post("/upload/avatar")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", Buffer.from("GIF89a"), {
          filename: "test.gif",
          contentType: "image/gif",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("UPLOAD_INVALID_FILE_TYPE");
    });

    it("should fail with file too large (>2MB)", async () => {
      // Create a buffer larger than 2MB
      const largeBuffer = Buffer.alloc(2.5 * 1024 * 1024, 0xff);

      const res = await request(app)
        .post("/upload/avatar")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", largeBuffer, {
          filename: "large.jpg",
          contentType: "image/jpeg",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("UPLOAD_INVALID_FILE_SIZE");
    });
  });

  describe("POST /upload/poi-photo", () => {
    it("should upload POI photo successfully without poiId", async () => {
      const res = await request(app)
        .post("/upload/poi-photo")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", createValidJpegBuffer(), "photo.jpg");

      expect(res.status).toBe(200);
      expect(res.body.url).toBeDefined();
      expect(res.body.url).toBe("https://s3.example.com/test-file.jpg");

      // Verify uploadFile was called
      expect(uploadFile).toHaveBeenCalledTimes(1);
    });

    it("should upload POI photo and associate with POI", async () => {
      // Create a POI
      const poi = await prisma.poi.create({
        data: {
          name: "Test POI",
          latitude: 48.8566,
          longitude: 2.3522,
          createdBy: userId,
          photoUrls: [],
        },
      });

      const res = await request(app)
        .post("/upload/poi-photo")
        .set("Authorization", `Bearer ${accessToken}`)
        .field("poiId", poi.id)
        .attach("file", createValidJpegBuffer(), "photo.jpg");

      expect(res.status).toBe(200);
      expect(res.body.url).toBeDefined();

      // Verify POI photoUrls was updated
      const updatedPoi = await prisma.poi.findUnique({ where: { id: poi.id } });
      expect(updatedPoi?.photoUrls).toContain("https://s3.example.com/test-file.jpg");
    });

    it("should upload PNG photo successfully", async () => {
      const res = await request(app)
        .post("/upload/poi-photo")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", createValidPngBuffer(), "photo.png");

      expect(res.status).toBe(200);
      expect(res.body.url).toBeDefined();
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .post("/upload/poi-photo")
        .attach("file", createValidJpegBuffer(), "photo.jpg");

      expect(res.status).toBe(401);
    });

    it("should fail without file", async () => {
      const res = await request(app)
        .post("/upload/poi-photo")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("UPLOAD_FILE_REQUIRED");
    });

    it("should fail with invalid file type", async () => {
      const res = await request(app)
        .post("/upload/poi-photo")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", Buffer.from("not an image"), {
          filename: "test.txt",
          contentType: "text/plain",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("UPLOAD_INVALID_FILE_TYPE");
    });

    it("should fail with file too large (>5MB)", async () => {
      // Create a buffer larger than 5MB
      const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024, 0xff);

      const res = await request(app)
        .post("/upload/poi-photo")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", largeBuffer, {
          filename: "large.jpg",
          contentType: "image/jpeg",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("UPLOAD_INVALID_FILE_SIZE");
    });

    it("should fail with non-existent poiId", async () => {
      const res = await request(app)
        .post("/upload/poi-photo")
        .set("Authorization", `Bearer ${accessToken}`)
        .field("poiId", "non-existent-id")
        .attach("file", createValidJpegBuffer(), "photo.jpg");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("POI_NOT_FOUND");
    });

    it("should fail when user does not own the POI", async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: "other-upload@example.com",
          passwordHash: "hash",
          emailVerified: true,
        },
      });

      // Create a POI owned by other user
      const poi = await prisma.poi.create({
        data: {
          name: "Other POI",
          latitude: 48.8566,
          longitude: 2.3522,
          createdBy: otherUser.id,
        },
      });

      const res = await request(app)
        .post("/upload/poi-photo")
        .set("Authorization", `Bearer ${accessToken}`)
        .field("poiId", poi.id)
        .attach("file", createValidJpegBuffer(), "photo.jpg");

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("POI_ACCESS_DENIED");

      // Cleanup
      await prisma.poi.delete({ where: { id: poi.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it("should add photo to existing photoUrls array", async () => {
      // Create a POI with existing photos
      const poi = await prisma.poi.create({
        data: {
          name: "Test POI with photos",
          latitude: 48.8566,
          longitude: 2.3522,
          createdBy: userId,
          photoUrls: ["https://s3.example.com/existing-photo.jpg"],
        },
      });

      const res = await request(app)
        .post("/upload/poi-photo")
        .set("Authorization", `Bearer ${accessToken}`)
        .field("poiId", poi.id)
        .attach("file", createValidJpegBuffer(), "photo.jpg");

      expect(res.status).toBe(200);

      // Verify photoUrls now has 2 items
      const updatedPoi = await prisma.poi.findUnique({ where: { id: poi.id } });
      expect(updatedPoi?.photoUrls).toHaveLength(2);
      expect(updatedPoi?.photoUrls).toContain("https://s3.example.com/existing-photo.jpg");
      expect(updatedPoi?.photoUrls).toContain("https://s3.example.com/test-file.jpg");
    });
  });
});
