import fs from "node:fs";

import { applyE2eEnv, userFile } from "./src/env";
import { createE2ePrisma } from "./src/prisma";
import { readE2eUser } from "./src/user";

applyE2eEnv();

export default async function globalTeardown(): Promise<void> {
  if (!fs.existsSync(userFile)) {
    return;
  }

  const { email } = readE2eUser();
  const prisma = createE2ePrisma();
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
  fs.rmSync(userFile, { force: true });
}
