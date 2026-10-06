import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SaveWall } from "./save-wall";

afterEach(cleanup);

const noop = () => {};

/**
 * The sheet is the one place the product asks for anything, and each reason
 * it opens for gets its own words. The words are the design's, so they are
 * tested as strings rather than as patterns.
 */
describe("SaveWall, the words for each reason", () => {
  it("asks her to sign in to keep a home, and says who is not told", () => {
    render(
      <SaveWall
        reason="save"
        listingId="ellendale-64"
        onCancel={noop}
        onDone={noop}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Sign in to keep this one" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send me a link" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "No password to remember. We do not sell your email, and no agent is told you looked.",
      ),
    ).toBeInTheDocument();
  });

  it("promises the number on the next screen as well as by email, and no phone call", () => {
    render(<SaveWall reason="budget" onCancel={noop} onDone={noop} />);
    expect(
      screen.getByRole("button", { name: "Show me my number" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "It opens on the next screen as well as in your inbox. No phone number, and no agent is told your address.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the search's own words", () => {
    render(<SaveWall reason="search" onCancel={noop} onDone={noop} />);
    expect(
      screen.getByRole("heading", { name: "Keep this search" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send me a link" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/We never sell your email/)).toBeInTheDocument();
  });
});
