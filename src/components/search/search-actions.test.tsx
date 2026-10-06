import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchActions } from "./search-actions";

afterEach(cleanup);

/**
 * Share copies the link and confirms on the button for two seconds. No
 * modal, no email step, and nothing is sent to anyone, which is why the only
 * thing to observe is the clipboard and the announcement.
 */
describe("share", () => {
  const writeText = vi.fn<(text: string) => Promise<void>>();

  beforeEach(() => {
    vi.useFakeTimers();
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("copies the link, confirms for two seconds, and then goes back", async () => {
    render(
      <SearchActions saved={false} onToggleSave={() => {}} shareHref="/homes-with-a-suite?view=expanded" />,
    );
    const button = screen.getByRole("button", { name: /^Share/ });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(writeText).toHaveBeenCalledWith(
      new URL("/homes-with-a-suite?view=expanded", window.location.href).toString(),
    );
    expect(screen.getByText("Link copied")).toBeInTheDocument();
    expect(button).toHaveAttribute("title", "Link copied");

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText("Link copied")).toBeNull();
    expect(button).toHaveAttribute("title", "Share this search");
  });

  it("copies the page's own address when the page passes nothing", async () => {
    render(<SearchActions saved={false} onToggleSave={() => {}} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Share/ }));
    });
    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });

  it("does not confirm a copy that was refused", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    render(<SearchActions saved={false} onToggleSave={() => {}} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Share/ }));
    });
    expect(screen.queryByText("Link copied")).toBeNull();
  });
});

describe("save", () => {
  it("reads Saved once it is, and hands the press to the page", () => {
    const onToggleSave = vi.fn();
    render(<SearchActions saved={false} onToggleSave={onToggleSave} />);
    fireEvent.click(screen.getByRole("button", { name: /^Save search/ }));
    expect(onToggleSave).toHaveBeenCalledTimes(1);
    cleanup();
    render(<SearchActions saved onToggleSave={onToggleSave} />);
    expect(screen.getByRole("button", { name: /^Saved/ })).toHaveAttribute("aria-pressed", "true");
  });
});
