import { readE2eUser } from "../src/user";

import { expect, test } from "./fixtures";
import { fillLoginForm } from "./helpers";

test.describe("auth", () => {
  test("shows an error toast for invalid credentials", async ({ page }) => {
    const user = readE2eUser();

    await fillLoginForm(page, user.email, "wrong-password");

    await expect(page.getByText("Erreur de connexion")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
