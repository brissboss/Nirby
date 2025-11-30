import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  PORT: z.string().transform(Number).pipe(z.number().positive()),
  NODE_ENV: z.enum(["development", "production", "staging", "test"]).default("development"),
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
  RESEND_API_KEY: z.string().startsWith("re_"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  EMAIL_VERIFICATION_TEMPLATE_ID_EN: z.string().optional(),
  EMAIL_VERIFICATION_TEMPLATE_ID_FR: z.string().optional(),
});

export const env = envSchema.parse(process.env);
