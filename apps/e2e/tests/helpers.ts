import { expect, type Page } from "@playwright/test";

import { readE2eUser } from "../src/user";

/** Password input is wrapped in a div, so the visible label is not associated. */
export async function fillLoginForm(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

export async function loginSuccessfully(page: Page): Promise<void> {
  const user = readE2eUser();
  await fillLoginForm(page, user.email, user.password);
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
}

export async function openShellView(
  page: Page,
  name: "Explorer" | "Listes" | "Profil"
): Promise<void> {
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("button", { name })
    .click();
}

export async function createListFromIndex(page: Page, listName: string): Promise<void> {
  await openShellView(page, "Listes");
  await expect(page.getByRole("heading", { name: "Listes" })).toBeVisible();

  await page
    .getByRole("button", { name: "Créer une liste" })
    .or(page.getByRole("button", { name: "Nouvelle liste" }))
    .click();

  await expect(page.getByRole("heading", { name: "Nouvelle liste" })).toBeVisible();
  await page.getByLabel("Nom").fill(listName);
  await page.getByRole("button", { name: "Créer", exact: true }).click();
  await expect(page.getByRole("button", { name: listName })).toBeVisible();
}
