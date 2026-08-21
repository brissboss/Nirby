import { seedListWithCustomPoi } from "../src/seed";
import { readE2eUser } from "../src/user";

import { expect, test } from "./fixtures";
import { loginSuccessfully, openShellView } from "./helpers";

test.describe("pois", () => {
  test("shows a seeded custom POI on a list without Mapbox", async ({ page }) => {
    const user = readE2eUser();
    const listName = `E2E POI list ${Date.now()}`;
    const poiName = `E2E Café ${Date.now()}`;

    await seedListWithCustomPoi({ userId: user.id, listName, poiName });
    await loginSuccessfully(page);
    await openShellView(page, "Listes");

    await page.getByRole("button", { name: listName }).click();
    await expect(page.getByRole("heading", { name: listName })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lieux" })).toBeVisible();
    await expect(page.getByRole("heading", { name: poiName })).toBeVisible();
  });
});
