import * as Sentry from "@sentry/nextjs";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CookieConsent, useCookieConsent } from "./cookie-consent";

import { readConsent } from "@/lib/consent/consent";
import { expectNoAxeViolations } from "@/test/axe";

vi.mock("@sentry/nextjs", () => ({
  init: vi.fn(),
  close: vi.fn(),
  getClient: vi.fn(() => undefined),
}));

function OpenPreferencesButton() {
  const { openPreferences } = useCookieConsent();
  return (
    <button type="button" onClick={openPreferences}>
      open-prefs
    </button>
  );
}

function renderBanner() {
  return render(
    <CookieConsent>
      <OpenPreferencesButton />
    </CookieConsent>
  );
}

describe("CookieConsent", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(Sentry.getClient).mockReturnValue(undefined);
  });

  it("shows the dialog when no choice is stored", async () => {
    renderBanner();

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "accept" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "refuse" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "customize" })).toBeInTheDocument();
  });

  it("hides the dialog after a choice and keeps it after a simulated reload", async () => {
    const { unmount } = renderBanner();

    await userEvent.click(await screen.findByRole("button", { name: "refuse" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(readConsent()?.sentry).toBe(false);

    unmount();
    renderBanner();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "open-prefs" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(readConsent()?.sentry).toBe(false);
  });

  it("does not call Sentry.init on refuse, then inits after accept", async () => {
    renderBanner();

    await userEvent.click(await screen.findByRole("button", { name: "refuse" }));
    expect(Sentry.init).not.toHaveBeenCalled();
    expect(readConsent()?.sentry).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "open-prefs" }));
    await userEvent.click(await screen.findByRole("button", { name: "accept" }));

    expect(Sentry.init).toHaveBeenCalled();
    expect(readConsent()?.sentry).toBe(true);
  });

  it("has no axe violations when the dialog is open", async () => {
    renderBanner();
    const dialog = await screen.findByRole("dialog");

    await expectNoAxeViolations(dialog);
  });
});
