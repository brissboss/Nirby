import fs from "node:fs";
import path from "node:path";

function findRepoRoot(start: string): string {
  let dir = start;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error(`Could not find repo root from ${start}`);
}

export const e2eRoot = fs.existsSync(path.join(process.cwd(), "playwright.config.ts"))
  ? process.cwd()
  : path.resolve(process.cwd(), "apps/e2e");
export const repoRoot = findRepoRoot(e2eRoot);
export const authDir = path.join(e2eRoot, ".auth");
export const userFile = path.join(authDir, "user.json");

export const E2E_PASSWORD = "e2e-password-1";

export const e2eApiEnv: Record<string, string> = {
  DATABASE_URL: "postgresql://nirby:nirby@localhost:5432/nirby_test",
  REDIS_URL: "redis://localhost:6379",
  PORT: "4000",
  LOG_LEVEL: "fatal",
  NODE_ENV: "test",
  JWT_SECRET: "test-secret-min-32-characters-long-for-testing-only",
  ACCESS_TOKEN_TTL: "900",
  REFRESH_TOKEN_TTL: "604800",
  RESEND_API_KEY: "re_test_key_for_testing",
  FRONTEND_URL: "http://localhost:3000",
  EMAIL_VERIFICATION_TEMPLATE_ID_EN: "3b87e129-5741-4c29-b6b9-c673ddf54353",
  EMAIL_VERIFICATION_TEMPLATE_ID_FR: "f25c7b0f-abd2-4abd-9d2c-72272aba0779",
  GOOGLE_PLACES_API_KEY: "AIzaFakeTestApiKey123",
};

/** Fill missing process.env keys so the API Zod schema and Prisma setup can boot. */
export function applyE2eEnv(): void {
  for (const [key, value] of Object.entries(e2eApiEnv)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function mergeEnv(extra: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      out[key] = value;
    }
  }
  return { ...out, ...extra };
}

export function apiEnvForWebServer(): Record<string, string> {
  applyE2eEnv();
  return {
    DATABASE_URL: process.env.DATABASE_URL ?? e2eApiEnv.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL ?? e2eApiEnv.REDIS_URL,
    PORT: process.env.E2E_API_PORT ?? e2eApiEnv.PORT,
    LOG_LEVEL: e2eApiEnv.LOG_LEVEL,
    NODE_ENV: "test",
    JWT_SECRET: process.env.JWT_SECRET ?? e2eApiEnv.JWT_SECRET,
    ACCESS_TOKEN_TTL: e2eApiEnv.ACCESS_TOKEN_TTL,
    REFRESH_TOKEN_TTL: e2eApiEnv.REFRESH_TOKEN_TTL,
    RESEND_API_KEY: process.env.RESEND_API_KEY ?? e2eApiEnv.RESEND_API_KEY,
    FRONTEND_URL: process.env.FRONTEND_URL ?? e2eApiEnv.FRONTEND_URL,
    EMAIL_VERIFICATION_TEMPLATE_ID_EN:
      process.env.EMAIL_VERIFICATION_TEMPLATE_ID_EN ?? e2eApiEnv.EMAIL_VERIFICATION_TEMPLATE_ID_EN,
    EMAIL_VERIFICATION_TEMPLATE_ID_FR:
      process.env.EMAIL_VERIFICATION_TEMPLATE_ID_FR ?? e2eApiEnv.EMAIL_VERIFICATION_TEMPLATE_ID_FR,
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY ?? e2eApiEnv.GOOGLE_PLACES_API_KEY,
  };
}
