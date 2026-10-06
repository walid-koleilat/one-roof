import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BENDALE, GALLOWAY } from "@/data/listings";
import { mattersFor } from "@/lib/domain/matters";
import { ListingCard } from "./listing-card";

afterEach(cleanup);

/**
 * The underlined claim opens its photograph over the card with the source
 * beneath it, and the X closes it. The two kinds of source are told apart by
 * their outline and never by a colour, which is why the classes are checked
 * rather than the words alone.
 */
describe("the evidence row", () => {
  it("opens the photograph with its caption on it, keeps the sources behind a mark, and the X closes it", () => {
    const matters = mattersFor(BENDALE);
    render(
      <ListingCard listing={BENDALE} matters={matters} onSelect={() => {}} />,
    );
    const proof = BENDALE.proof!;
    expect(screen.queryByText(proof.caption)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: matters[0].label }));
    expect(screen.getByText(proof.caption)).toBeInTheDocument();
    // The sentence under the photograph stays, so the card does not grow.
    expect(screen.getByText(BENDALE.summary)).toBeInTheDocument();

    // The sources are one line in a tooltip on the mark, never over the picture.
    const sources = screen.getByRole("tooltip");
    expect(sources).toHaveTextContent("City permit records (on record) · Photo read by us (our reading)");
    expect(sources.className).not.toMatch(/warm|conf-|action/);
    expect(screen.getByRole("button", { name: "Where this comes from" })).toHaveAttribute(
      "aria-describedby",
      sources.id,
    );

    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close the evidence" }));
    expect(screen.queryByText(proof.caption)).toBeNull();
  });

  it("names only the read we made when there is nothing at the city to cite", () => {
    const matters = mattersFor(GALLOWAY);
    render(<ListingCard listing={GALLOWAY} matters={matters} />);
    fireEvent.click(screen.getByRole("button", { name: matters[0].label }));
    const sources = screen.getByRole("tooltip");
    expect(sources).toHaveTextContent("Photo read by us");
    expect(sources).not.toHaveTextContent("City permit records");
  });
});
