import { createRequire } from "node:module";
import path from "node:path";

import { applyE2eEnv, repoRoot } from "./env";

applyE2eEnv();

export type E2ePrisma = {
  user: {
    deleteMany: (args: { where: { email: string } }) => Promise<unknown>;
    create: (args: {
      data: { email: string; passwordHash: string; name: string; emailVerified: boolean };
    }) => Promise<{ id: string }>;
  };
  poiList: {
    create: (args: {
      data: {
        name: string;
        description?: string;
        createdBy: string;
        visibility: "PRIVATE";
      };
    }) => Promise<{ id: string }>;
  };
  poi: {
    create: (args: {
      data: {
        name: string;
        description?: string;
        address?: string;
        latitude: number;
        longitude: number;
        category?: string;
        visibility: "PRIVATE";
        createdBy: string;
      };
    }) => Promise<{ id: string }>;
  };
  savedPoi: {
    create: (args: { data: { listId: string; poiId: string } }) => Promise<unknown>;
  };
  $disconnect: () => Promise<void>;
};

export function createE2ePrisma(): E2ePrisma {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for e2e Prisma");
  }

  const requireApi = createRequire(path.join(repoRoot, "apps/api/package.json"));
  const { PrismaClient } = requireApi("@prisma/client") as {
    PrismaClient: new (args: { adapter: unknown }) => E2ePrisma;
  };
  const { PrismaPg } = requireApi("@prisma/adapter-pg") as {
    PrismaPg: new (args: { connectionString: string }) => unknown;
  };

  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}
