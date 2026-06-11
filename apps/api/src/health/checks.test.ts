import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkRedis, checkStorage } from "./checks";

vi.mock("../redis", () => ({
  redisClient: {
    isOpen: true,
    ping: vi.fn().mockResolvedValue("PONG"),
  },
}));

vi.mock("../upload/service", () => ({
  isStorageConfigured: vi.fn(),
  pingStorage: vi.fn(),
}));

describe("readiness checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkRedis", () => {
    it("returns healthy when Redis responds to ping", async () => {
      const result = await checkRedis();

      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBeTypeOf("number");
    });
  });

  describe("checkStorage", () => {
    it("skips storage when S3 is not configured", async () => {
      const { isStorageConfigured } = await import("../upload/service");
      vi.mocked(isStorageConfigured).mockReturnValue(false);

      const result = await checkStorage();

      expect(result).toEqual({ ok: true, skipped: true });
    });

    it("returns healthy when storage ping succeeds", async () => {
      const { isStorageConfigured, pingStorage } = await import("../upload/service");
      vi.mocked(isStorageConfigured).mockReturnValue(true);
      vi.mocked(pingStorage).mockResolvedValue(undefined);

      const result = await checkStorage();

      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBeTypeOf("number");
    });
  });
});
