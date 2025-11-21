import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  PORT: z.string().transform(Number).pipe(z.number().positive()),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.coerce
    .number()
    .positive()
    .default(15 * 60),
  REFRESH_TOKEN_TTL: z.coerce
    .number()
    .positive()
    .default(7 * 24 * 60 * 60),
});

export const env = envSchema.parse(process.env);
