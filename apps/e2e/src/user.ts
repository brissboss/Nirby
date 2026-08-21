import fs from "node:fs";

import { userFile } from "./env";

export type E2eUser = {
  id: string;
  email: string;
  password: string;
};

export function readE2eUser(): E2eUser {
  const raw = fs.readFileSync(userFile, "utf8");
  const parsed = JSON.parse(raw) as E2eUser;
  if (!parsed.id || !parsed.email || !parsed.password) {
    throw new Error(`Invalid e2e user file: ${userFile}`);
  }
  return parsed;
}
