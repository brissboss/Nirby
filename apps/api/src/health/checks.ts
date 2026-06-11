import { prisma } from "../db";
import { env } from "../env";
import { redisClient } from "../redis";
import { isStorageConfigured, pingStorage } from "../upload/service";

import type { DependencyCheckResult } from "./types";

const CHECK_TIMEOUT_MS = 3_000;

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`${label} timed out after ${CHECK_TIMEOUT_MS}ms`)),
      CHECK_TIMEOUT_MS
    );
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function measureCheck(
  label: string,
  run: () => Promise<void>
): Promise<DependencyCheckResult> {
  const start = Date.now();

  try {
    await withTimeout(run(), label);
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, latencyMs: Date.now() - start, error: message };
  }
}

export async function checkDatabase(): Promise<DependencyCheckResult> {
  return measureCheck("database", async () => {
    await prisma.$queryRaw`SELECT 1`;
  });
}

export async function checkRedis(): Promise<DependencyCheckResult> {
  if (!env.REDIS_URL) {
    return { ok: true, skipped: true };
  }

  if (!redisClient) {
    return { ok: false, error: "Redis client not initialized" };
  }

  if (!redisClient.isOpen) {
    return { ok: false, error: "Redis not connected" };
  }

  return measureCheck("redis", async () => {
    const response = await redisClient!.ping();
    if (response !== "PONG") {
      throw new Error(`Unexpected Redis ping response: ${response}`);
    }
  });
}

export async function checkStorage(): Promise<DependencyCheckResult> {
  if (!isStorageConfigured()) {
    return { ok: true, skipped: true };
  }

  return measureCheck("storage", pingStorage);
}
