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
        lines: 36,
        functions: 30,
        branches: 26,
        statements: 36,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
