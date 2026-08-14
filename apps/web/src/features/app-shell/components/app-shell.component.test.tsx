import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const push = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => searchParams,
}));

vi.mock("@/features/auth", () => ({
  AuthGate: ({ children }: { children: React.ReactNode }) => children,
}));

import { AppShell } from "./app-shell.component";

import { MAIN_CONTENT_ID } from "@/lib/a11y/landmarks";

const stubViews = {
  explore: () => <div>Explore</div>,
  lists: () => <div>Lists</div>,
  profile: () => <div>Profile</div>,
};

describe("AppShell landmarks", () => {
  beforeEach(() => {
    replace.mockClear();
    push.mockClear();
    searchParams = new URLSearchParams();
  });

  it("exposes a single main landmark with a skip-link target id", () => {
    render(<AppShell viewComponents={stubViews} />);

    const mains = screen.getAllByRole("main");
    expect(mains).toHaveLength(1);
    expect(mains[0]).toHaveAttribute("id", MAIN_CONTENT_ID);
  });
});
