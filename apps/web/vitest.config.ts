import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",

    setupFiles: ["./src/test/setup.ts"],

    include: ["src/**/*.{test,spec}.{ts,tsx}"],

    globals: true,

    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "components/ui/**",
        "**/*.{test,spec}.{ts,tsx}",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData/**",
        "**/__mocks__/**",
        "**/lib/api/generated/**",
        "**/lib/auth/index.ts",
      ],
      thresholds: {
        // Floor ~2–3 points under the Aug 2026 measured run (NIR-110):
        // 85.34% lines / 83.55% functions / 74.88% branches / 84.26% statements.
        lines: 82,
        functions: 80,
        branches: 72,
        statements: 81,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
