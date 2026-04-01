import "dotenv/config";
import path from "node:path";

import { defineConfig } from "prisma/config";

function migrateDatabaseUrl(): string {
  return process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrateDatabaseUrl(),
  },
});
