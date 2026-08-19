import { expect } from "vitest";
import { axe } from "vitest-axe";

/** jsdom cannot compute contrast; component tests omit page landmarks (`<main>`). */
const jsdomAxeOptions = {
  rules: {
    "color-contrast": { enabled: false },
    region: { enabled: false },
  },
};

export async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe(container, jsdomAxeOptions);
  expect(results).toHaveNoViolations();
}
