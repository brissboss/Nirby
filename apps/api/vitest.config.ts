import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["__test__/**/*.test.ts"],
    env: {
      DATABASE_URL: "postgresql://nirby:nirby@localhost:5432/nirby_test",
      REDIS_URL: "redis://localhost:6379",
      PORT: "4000",
      LOG_LEVEL: "error",
      NODE_ENV: "test",
      JWT_SECRET: "test-secret-min-32-characters-long-for-testing-only",
      ACCESS_TOKEN_TTL: "900",
      REFRESH_TOKEN_TTL: "604800",
      RESEND_API_KEY: "re_test_key_for_testing",
      FRONTEND_URL: "http://localhost:3000",
      EMAIL_VERIFICATION_TEMPLATE_ID_EN: "3b87e129-5741-4c29-b6b9-c673ddf54353",
      EMAIL_VERIFICATION_TEMPLATE_ID_FR: "f25c7b0f-abd2-4abd-9d2c-72272aba0779",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", "__test__/", "prisma/"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
