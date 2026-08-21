import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { applyE2eEnv, repoRoot, userFile } from "./src/env";
import { readE2eUser } from "./src/user";

applyE2eEnv();

type PrismaClientLike = {
  user: {
    deleteMany: (args: { where: { email: string } }) => Promise<unknown>;
  };
  $disconnect: () => Promise<void>;
};

export default async function globalTeardown(): Promise<void> {
  if (!fs.existsSync(userFile)) {
    return;
  }

  const { email } = readE2eUser();
  const requireApi = createRequire(path.join(repoRoot, "apps/api/package.json"));
  const { PrismaClient } = requireApi("@prisma/client") as {
    PrismaClient: new (args: { adapter: unknown }) => PrismaClientLike;
  };
  const { PrismaPg } = requireApi("@prisma/adapter-pg") as {
    PrismaPg: new (args: { connectionString: string }) => unknown;
  };

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return;
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
  fs.rmSync(userFile, { force: true });
}
