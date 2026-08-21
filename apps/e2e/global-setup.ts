import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { applyE2eEnv, authDir, E2E_PASSWORD, repoRoot, userFile } from "./src/env";
import { createE2ePrisma } from "./src/prisma";

applyE2eEnv();

export default async function globalSetup(): Promise<void> {
  const requireApi = createRequire(path.join(repoRoot, "apps/api/package.json"));
  const bcrypt = requireApi("bcrypt") as {
    hash: (password: string, rounds: number) => Promise<string>;
  };

  const prisma = createE2ePrisma();
  const email = `e2e.${process.pid}.${Date.now()}@nirby.test`;
  const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10);

  await prisma.user.deleteMany({ where: { email } });
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "E2E User",
      emailVerified: true,
    },
  });
  await prisma.$disconnect();

  fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(
    userFile,
    JSON.stringify({ id: user.id, email, password: E2E_PASSWORD }, null, 2)
  );
}
