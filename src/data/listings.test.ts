import { describe, expect, it } from "vitest";
import { LISTINGS } from "./listings";

/**
 * A photograph offered as evidence has to say where it came from, and the
 * rule for what it says is a rule about the data rather than the card. The
 * two sources are drawn differently on purpose - solid for a file we did not
 * make, dashed for a read we did - so a listing that cites the wrong one is
 * telling her something false in a way she can see.
 */
describe("the evidence behind a claim", () => {
  const withProof = LISTINGS.filter((l) => l.proof);

  it("names at least one source for every photograph offered as evidence", () => {
    expect(withProof.length).toBeGreaterThan(0);
    for (const listing of withProof) {
      expect(listing.proof!.sources.length).toBeGreaterThan(0);
    }
  });

  it("cites the city's own file exactly when the claim is about the file", () => {
    // A suite with a permit, and a kitchen the city has no record of, are
    // both claims about what the file says. A ground-floor room and a ceiling
    // height are not, and citing the file for those would be borrowing its
    // authority for a thing it never checked.
    for (const listing of withProof) {
      const cites = listing.proof!.sources.some((s) => !s.computed);
      const aboutTheFile =
        listing.suite === "legal-suite" || listing.suite === "no-permit";
      expect(cites).toBe(aboutTheFile);
    }
  });

  it("owns up to the read we made ourselves, every time", () => {
    for (const listing of withProof) {
      expect(listing.proof!.sources.some((s) => s.computed)).toBe(true);
    }
  });
});

/**
 * Two rules the board draws on every card, held here so a new row cannot
 * quietly break them: the sentence leads with the neighbourhood, and every
 * claim has evidence she can open, taken from the home's own photographs.
 */
describe("what every card carries", () => {
  it("opens the sentence with the neighbourhood, since the address leads", () => {
    for (const listing of LISTINGS) {
      expect(listing.summary.startsWith(listing.neighbourhood)).toBe(true);
    }
  });

  it("offers a photograph as evidence on every card, and one of the home's own", () => {
    for (const listing of LISTINGS) {
      expect(listing.proof, listing.address).toBeDefined();
      expect(listing.photos).toContain(listing.proof!.photo);
    }
  });
});
