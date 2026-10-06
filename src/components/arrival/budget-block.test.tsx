import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BudgetBlock, homesLine } from "./budget-block";
import { AccountProvider } from "@/components/account/account-provider";
import { ARRIVAL_SHOWN, DEFAULT_SEARCH, listingsFor } from "@/data/counts";
import { SAMPLE_ADDRESS, SEMI_BRACKET, SEMI_WORKED } from "@/data/semi-bracket";
import { LISTINGS } from "@/data/listings";

/** The homes the search page puts above this block, in its opening state. */
const shown = listingsFor(DEFAULT_SEARCH, LISTINGS).slice(0, ARRIVAL_SHOWN);

afterEach(cleanup);

/**
 * The opening line used to say "eight homes" and "$1,340,000" while seven
 * cards sat above it topping out at $1,229,000. A sentence that counts the
 * cards has to be computed from the cards.
 */
describe("homesLine", () => {
  it("counts the homes on the page and brackets their asking prices", () => {
    expect(homesLine(shown)).toBe(
      "Those seven homes run from $1,092,000 to $1,229,000. Which ones you can afford depends on what your own house sells for.",
    );
  });

  it("drops the range when there is nothing on the page", () => {
    const line = homesLine([]);
    expect(line).not.toMatch(/\$/);
    expect(line).not.toMatch(/zero/);
    expect(line).toMatch(/depends on what your own house sells for\.$/);
  });

  it("does not write 'from X to X' for one home", () => {
    const one = shown.slice(0, 1);
    const line = homesLine(one);
    expect(line).toContain(shown[0]!.askingPrice.value.toLocaleString("en-CA"));
    expect(line).not.toMatch(/ to /);
  });
});

describe("BudgetBlock", () => {
  it("shows the bracket only when she said she has a semi to sell", () => {
    render(<BudgetBlock context homes={shown} />);
    expect(screen.getByText(SEMI_BRACKET.title)).toBeInTheDocument();
    expect(screen.getByText(SEMI_BRACKET.confidence)).toBeInTheDocument();
  });

  it("assumes no home type when she arrived without context", () => {
    render(<BudgetBlock context={false} homes={shown} />);
    expect(screen.queryByText(SEMI_BRACKET.title)).toBeNull();
    // The half that assumes nothing stays: an address in, a number out.
    expect(
      screen.getByPlaceholderText("Enter the address you would sell"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Work out my budget" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/no agent is called/)).toBeInTheDocument();
  });

  it("writes the bracket from the data, not from a literal", () => {
    render(<BudgetBlock context homes={shown} />);
    expect(screen.getByText("$938,000")).toBeInTheDocument();
    expect(screen.getByText("$992,000")).toBeInTheDocument();
    expect(SEMI_BRACKET.low.provenance.kind).toBe("mock");
  });

  it("offers four inputs and no rent", () => {
    render(<BudgetBlock context homes={shown} />);
    expect(SEMI_BRACKET.inputs).toHaveLength(4);
    expect(screen.queryByText(/rent/i)).toBeNull();
  });
});

/**
 * The steps are for a number. Once she has walked them the form gives way
 * to that number, the four things it rests on fill in, and the ceiling they
 * leave can go straight into the search.
 */
describe("BudgetBlock, once the steps are walked", () => {
  it("replaces the form with her number and offers the ceiling to the search", () => {
    const onCeiling = vi.fn();
    render(
      <AccountProvider startSignedIn>
        <BudgetBlock context homes={shown} ceiling={null} onCeiling={onCeiling} />
      </AccountProvider>,
    );
    expect(screen.queryByRole("button", { name: "Work out my budget" })).toBeNull();
    expect(screen.getAllByText("$964,000").length).toBeGreaterThan(0);
    expect(screen.getByText(SEMI_WORKED.confidence)).toBeInTheDocument();
    expect(screen.getByText(/A sample address, for the prototype/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`^${SAMPLE_ADDRESS}`))).toBeInTheDocument();
    for (const input of SEMI_WORKED.inputs) {
      expect(screen.getAllByText(input.value).length).toBeGreaterThan(0);
    }
    fireEvent.click(screen.getByRole("button", { name: "Use it as my ceiling" }));
    expect(onCeiling).toHaveBeenCalledWith(SEMI_WORKED.ceiling);
  });

  it("says so when the search already uses that ceiling", () => {
    render(
      <AccountProvider startSignedIn>
        <BudgetBlock context homes={shown} ceiling={SEMI_WORKED.ceiling} onCeiling={() => {}} />
      </AccountProvider>,
    );
    expect(screen.getByText("Your search already uses it.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Use it as my ceiling" })).toBeNull();
  });
});
