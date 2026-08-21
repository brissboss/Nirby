import type { Page } from "@playwright/test";

/** Password input is wrapped in a div, so the visible label is not associated. */
export async function fillLoginForm(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}
