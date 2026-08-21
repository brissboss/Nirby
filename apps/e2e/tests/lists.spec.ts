import { expect, test } from "./fixtures";
import { createListFromIndex, loginSuccessfully } from "./helpers";

test.describe("lists", () => {
  test("logs in and creates a list", async ({ page }) => {
    const listName = `E2E create ${Date.now()}`;

    await loginSuccessfully(page);
    await createListFromIndex(page, listName);
  });

  test("deletes a list from its detail view", async ({ page }) => {
    const listName = `E2E delete ${Date.now()}`;

    await loginSuccessfully(page);
    await createListFromIndex(page, listName);

    await page.getByRole("button", { name: listName }).click();
    await expect(page.getByRole("heading", { name: listName })).toBeVisible();

    await page.getByRole("button", { name: "Supprimer" }).click();
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();

    await expect(page.getByText("Liste supprimée avec succès")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Listes" })).toBeVisible();
    await expect(page.getByRole("button", { name: listName })).toHaveCount(0);
  });
});
