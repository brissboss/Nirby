import { expect, test } from "./fixtures";
import { loginSuccessfully, openShellView } from "./helpers";

test.describe("session", () => {
  test("keeps the JWT cookie on reload and logs out from profile", async ({ page }) => {
    await loginSuccessfully(page);

    await page.reload();
    await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Connexion requise" })).toHaveCount(0);

    await openShellView(page, "Profil");
    await expect(page.getByRole("heading", { name: "Ton espace Nirby" })).toBeVisible();
    await page.getByRole("button", { name: "Confidentialité" }).click();
    await page.getByRole("button", { name: "Déconnexion" }).click();

    await expect(page.getByRole("heading", { name: "Connexion requise" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Connexion requise" })).toBeVisible();
  });
});
