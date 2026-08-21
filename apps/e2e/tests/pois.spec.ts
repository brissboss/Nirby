import { expect, test } from "./fixtures";
import {
  createListFromIndex,
  loginSuccessfully,
  openCreatePoiDialog,
  openShellView,
} from "./helpers";

test.describe("pois", () => {
  test("creates a custom POI and adds it to a list", async ({ page }) => {
    const listName = `E2E POI list ${Date.now()}`;
    const poiName = `E2E Café ${Date.now()}`;

    await loginSuccessfully(page);
    await createListFromIndex(page, listName);
    await openShellView(page, "Explorer");

    await openCreatePoiDialog(page);

    const dialog = page.getByRole("dialog", { name: "Nouveau lieu" });
    await dialog.getByLabel("Nom").fill(poiName);
    await dialog.getByRole("combobox", { name: "Liste" }).click();
    await page.getByRole("option", { name: listName }).click();
    await dialog.getByRole("button", { name: "Créer" }).click();

    await expect(page.getByText("Lieu ajouté à la liste")).toBeVisible();
    await page.getByRole("button", { name: "Voir la liste" }).click();

    await expect(page.getByRole("heading", { name: listName })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lieux" })).toBeVisible();
    await expect(page.getByRole("heading", { name: poiName })).toBeVisible();
  });
});
