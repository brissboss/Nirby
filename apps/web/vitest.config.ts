import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",

    setupFiles: ["./__tests__/setup.ts"],

    include: ["__tests__/**/*.{test,spec}.{ts,tsx}"],

    globals: true,

    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "__tests__/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData/**",
        "**/__mocks__/**",
        "**/lib/api/generated/**",
        "**/lib/auth/index.ts",
      ],
      thresholds: {
        lines: 40,
        functions: 39,
        branches: 29,
        statements: 40,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
