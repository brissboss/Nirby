import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace, prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => searchParams,
}));

import { EXPLORE_SEARCH_DEBOUNCE_MS } from "../../constants/shell.constants";
import { ShellProvider } from "../../context/shell-context";

import { SearchBox } from "./search-box.component";

/** Both instances are always mounted and toggled by CSS, like in the real shell. */
function renderSearchBoxes() {
  render(
    <ShellProvider>
      <SearchBox />
      <SearchBox compact />
    </ShellProvider>
  );

  return screen.getAllByRole("searchbox");
}

function typeIn(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

function settleDebounce(ms = EXPLORE_SEARCH_DEBOUNCE_MS) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("SearchBox", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockClear();
    replace.mockImplementation((href: string) => {
      searchParams = new URLSearchParams(href.split("?")[1] ?? "");
    });
    searchParams = new URLSearchParams();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps every instance in sync while typing", () => {
    const [desktop, mobile] = renderSearchBoxes();

    typeIn(desktop, "caf");

    expect(desktop).toHaveValue("caf");
    expect(mobile).toHaveValue("caf");
  });

  it("commits the query to the URL once typing settles", () => {
    const [desktop] = renderSearchBoxes();

    typeIn(desktop, "c");
    settleDebounce(EXPLORE_SEARCH_DEBOUNCE_MS / 2);
    typeIn(desktop, "caf");
    settleDebounce(EXPLORE_SEARCH_DEBOUNCE_MS / 2);

    expect(replace).not.toHaveBeenCalled();

    settleDebounce();

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/?q=caf", { scroll: false });
  });

  it("does not re-commit an unchanged query, even with several instances mounted", () => {
    const [desktop, mobile] = renderSearchBoxes();

    typeIn(desktop, "a");
    settleDebounce();
    replace.mockClear();

    settleDebounce();

    expect(replace).not.toHaveBeenCalled();
    expect(desktop).toHaveValue("a");
    expect(mobile).toHaveValue("a");
  });

  it("clears the search immediately when the clear button is clicked", () => {
    const [desktop, mobile] = renderSearchBoxes();

    typeIn(desktop, "caf");
    settleDebounce();
    replace.mockClear();

    fireEvent.click(screen.getAllByRole("button", { name: "search.clearAriaLabel" })[0]);

    expect(replace).toHaveBeenCalledWith("/", { scroll: false });
    expect(desktop).toHaveValue("");
    expect(mobile).toHaveValue("");
  });
});
