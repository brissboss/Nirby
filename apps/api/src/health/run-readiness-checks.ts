import { checkDatabase, checkRedis, checkStorage } from "./checks";
import type { ReadinessResponse } from "./types";

export async function runReadinessChecks(): Promise<ReadinessResponse> {
  const [database, redis, storage] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkStorage(),
  ]);

  const checks = { database, redis, storage };
  const ok = Object.values(checks).every((check) => check.ok || check.skipped);

  return {
    ok,
    time: new Date().toISOString(),
    checks,
  };
}
