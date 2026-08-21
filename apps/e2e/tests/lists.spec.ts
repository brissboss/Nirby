import { readE2eUser } from "../src/user";

import { expect, test } from "./fixtures";
import { fillLoginForm } from "./helpers";

test.describe("lists", () => {
  test("logs in and creates a list", async ({ page }) => {
    const user = readE2eUser();
    const listName = `E2E ${Date.now()}`;

    await fillLoginForm(page, user.email, user.password);

    await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();

    await page
      .getByRole("navigation", { name: "Navigation principale" })
      .getByRole("button", { name: "Listes" })
      .click();

    await expect(page.getByRole("heading", { name: "Listes" })).toBeVisible();
    await page.getByRole("button", { name: "Créer une liste" }).click();

    await expect(page.getByRole("heading", { name: "Nouvelle liste" })).toBeVisible();
    await page.getByLabel("Nom").fill(listName);
    await page.getByRole("button", { name: "Créer", exact: true }).click();

    await expect(page.getByRole("button", { name: listName })).toBeVisible();
  });
});
