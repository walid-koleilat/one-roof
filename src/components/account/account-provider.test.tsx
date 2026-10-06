import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountProvider, useAccount } from "./account-provider";

/** Enough of a page to press the provider's buttons and read its state. */
function Probe() {
  const account = useAccount();
  return (
    <div>
      <output data-testid="kept">{String(account.searchKept)}</output>
      <output data-testid="signed">{String(account.signedIn)}</output>
      <button type="button" onClick={account.askToKeepSearch}>
        ask
      </button>
      <button type="button" onClick={account.toggleSearchKept}>
        toggle
      </button>
      <button type="button" onClick={() => account.setSignedIn(false)}>
        out
      </button>
    </div>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/**
 * The bookmark on the bar reads filled only once the search is actually
 * kept, and the sheet is the only way there when she is signed out. These
 * walk the sheet rather than poking the state, because the state is the
 * sheet's to set.
 */
describe("keeping the search", () => {
  it("is not kept until the sheet finishes, and then it is", () => {
    render(
      <AccountProvider>
        <Probe />
      </AccountProvider>,
    );
    expect(screen.getByTestId("kept")).toHaveTextContent("false");

    fireEvent.click(screen.getByText("ask"));
    expect(
      screen.getByRole("dialog", { name: "Keep this search" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("kept")).toHaveTextContent("false");

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "n@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send me a link" }));
    act(() => {
      vi.advanceTimersByTime(2400);
    });
    fireEvent.click(screen.getByRole("button", { name: "Keep going" }));
    fireEvent.click(
      screen.getByRole("button", { name: "That is right. Keep it" }),
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByTestId("signed")).toHaveTextContent("true");
    expect(screen.getByTestId("kept")).toHaveTextContent("true");
  });

  it("does not put the sheet up for someone already signed in", () => {
    render(
      <AccountProvider startSignedIn>
        <Probe />
      </AccountProvider>,
    );
    fireEvent.click(screen.getByText("ask"));
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByText("toggle"));
    expect(screen.getByTestId("kept")).toHaveTextContent("true");
    fireEvent.click(screen.getByText("toggle"));
    expect(screen.getByTestId("kept")).toHaveTextContent("false");
  });

  it("forgets the search when she signs out", () => {
    render(
      <AccountProvider startSignedIn>
        <Probe />
      </AccountProvider>,
    );
    fireEvent.click(screen.getByText("toggle"));
    expect(screen.getByTestId("kept")).toHaveTextContent("true");
    fireEvent.click(screen.getByText("out"));
    expect(screen.getByTestId("kept")).toHaveTextContent("false");
  });
});
