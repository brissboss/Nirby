import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { applyE2eEnv, authDir, E2E_PASSWORD, repoRoot, userFile } from "./src/env";

applyE2eEnv();

type PrismaClientLike = {
  user: {
    deleteMany: (args: { where: { email: string } }) => Promise<unknown>;
    create: (args: {
      data: { email: string; passwordHash: string; name: string; emailVerified: boolean };
    }) => Promise<unknown>;
  };
  $disconnect: () => Promise<void>;
};

export default async function globalSetup(): Promise<void> {
  const requireApi = createRequire(path.join(repoRoot, "apps/api/package.json"));
  const { PrismaClient } = requireApi("@prisma/client") as {
    PrismaClient: new (args: { adapter: unknown }) => PrismaClientLike;
  };
  const { PrismaPg } = requireApi("@prisma/adapter-pg") as {
    PrismaPg: new (args: { connectionString: string }) => unknown;
  };
  const bcrypt = requireApi("bcrypt") as {
    hash: (password: string, rounds: number) => Promise<string>;
  };

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for e2e globalSetup");
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  const email = `e2e.${process.pid}.${Date.now()}@nirby.test`;
  const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10);

  await prisma.user.deleteMany({ where: { email } });
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "E2E User",
      emailVerified: true,
    },
  });
  await prisma.$disconnect();

  fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(userFile, JSON.stringify({ email, password: E2E_PASSWORD }, null, 2));
}
