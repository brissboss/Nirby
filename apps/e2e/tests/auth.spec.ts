import { readE2eUser } from "../src/user";

import { expect, test } from "./fixtures";

test.describe("auth", () => {
  test("shows an error toast for invalid credentials", async ({ page }) => {
    const user = readE2eUser();

    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Mot de passe").fill("wrong-password");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page.getByText("Erreur de connexion")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
