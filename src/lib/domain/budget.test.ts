import { describe, expect, it } from "vitest";
import { CEILING_INPUTS } from "@/data/budget";
import { LISTINGS } from "@/data/listings";
import {
  budgetLine,
  ceilingFrom,
  ceilingLine,
  countAgainst,
  verdictFor,
  verdictLabel,
  type BudgetCount,
  type Verdict,
} from "./budget";
import { sourced } from "./provenance";

/**
 * The ceiling is the one figure on the saved page that is about her, so its
 * rules are tests: it is a bracket with no middle, every end says what it
 * rests on, and a home priced between the ends is never rounded inside.
 */

const price = (n: number) => sourced(n, { kind: "mock", note: "test" });
const ceiling = ceilingFrom(CEILING_INPUTS);

describe("the inputs", () => {
  it("are all invented and each one says what it stands in for", () => {
    const figures = [
      CEILING_INPUTS.bracket.low,
      CEILING_INPUTS.bracket.high,
      CEILING_INPUTS.owing,
      CEILING_INPUTS.costs,
      CEILING_INPUTS.savings,
      CEILING_INPUTS.mortgage,
    ];
    for (const f of figures) {
      expect(f.provenance.kind).toBe("mock");
      if (f.provenance.kind === "mock") {
        expect(f.provenance.note.length).toBeGreaterThan(0);
      }
    }
  });

  it("keep the bracket a bracket, low below high", () => {
    expect(CEILING_INPUTS.bracket.low.value).toBeLessThan(
      CEILING_INPUTS.bracket.high.value,
    );
  });
});

describe("ceilingFrom", () => {
  it("lands on $1,190,000 to $1,290,000 exactly", () => {
    expect(ceiling.low.value).toBe(1_190_000);
    expect(ceiling.high.value).toBe(1_290_000);
  });

  it("carries the band through unchanged", () => {
    expect(ceiling.band).toBe(CEILING_INPUTS.band);
  });

  it("never computes a midpoint, by any name", () => {
    // Same idiom as the couldRent test in counts.test.ts. The semi is a
    // bracket; averaging it would turn her guess into our promise.
    expect(Object.keys(ceiling)).not.toContain("mid");
    expect(Object.keys(ceiling)).not.toContain("midpoint");
  });

  it("marks both ends as computed from every figure they rest on", () => {
    const labels = new Set(ceiling.rests.map((r) => r.label));
    for (const end of [ceiling.low, ceiling.high]) {
      expect(end.provenance.kind).toBe("computed");
      if (end.provenance.kind === "computed") {
        for (const label of labels) {
          expect(end.provenance.from, `${label} is not named`).toContain(label);
        }
      }
    }
  });

  it("lists what it rests on in the order the arithmetic runs", () => {
    expect(ceiling.rests.map((r) => r.sign)).toEqual([
      "bracket",
      "bracket",
      "less",
      "less",
      "plus",
      "plus",
    ]);
  });

  it("shows both ends of the bracket rather than one of them dressed as a number", () => {
    const bracket = ceiling.rests.filter((r) => r.sign === "bracket");
    expect(bracket.map((r) => r.value.value)).toEqual([
      CEILING_INPUTS.bracket.low.value,
      CEILING_INPUTS.bracket.high.value,
    ]);
  });

  it("hands each figure back with its own provenance, so a mock is labelled a mock", () => {
    for (const r of ceiling.rests) {
      expect(r.value.provenance.kind, r.label).toBe("mock");
    }
  });

  it("is exactly as wide as the bracket it rests on", () => {
    // The four fixed figures are the same at both ends; only the semi moves.
    expect(ceiling.high.value - ceiling.low.value).toBe(
      CEILING_INPUTS.bracket.high.value - CEILING_INPUTS.bracket.low.value,
    );
  });

  it("lands on neither end at any home's asking price", () => {
    // A reader must never be able to mistake the ceiling for a house.
    const asking = LISTINGS.map((l) => l.askingPrice.value);
    expect(asking).not.toContain(ceiling.low.value);
    expect(asking).not.toContain(ceiling.high.value);
  });
});

describe("verdictFor", () => {
  it("is inside only strictly below the low end", () => {
    expect(verdictFor(price(1_189_000), ceiling)).toBe("inside");
  });

  it("turns on her sale at both ends, inclusive", () => {
    // A price on the low end is inside only if the semi fetches the least the
    // bracket allows. That is a condition, not an answer.
    expect(verdictFor(price(1_190_000), ceiling)).toBe("depends");
    expect(verdictFor(price(1_290_000), ceiling)).toBe("depends");
  });

  it("is over one dollar past the high end", () => {
    expect(verdictFor(price(1_290_001), ceiling)).toBe("over");
  });

  it("is unset while she has not given us her house", () => {
    expect(verdictFor(price(1_000_000), null)).toBe("unset");
  });
});

describe("countAgainst", () => {
  it("accounts for every home it is given", () => {
    const count = countAgainst(LISTINGS, ceiling);
    expect(count.of).toBe(LISTINGS.length);
    expect(count.inside + count.depends + count.over + count.unset).toBe(count.of);
  });

  it("puts something in each of the three verdicts for the homes we show", () => {
    // If the fixture ever drifts so that nothing turns on her sale, the
    // middle state has no example on the page and the design loses its point.
    const count = countAgainst(LISTINGS, ceiling);
    expect(count.inside).toBeGreaterThan(0);
    expect(count.depends).toBeGreaterThan(0);
    expect(count.over).toBeGreaterThan(0);
    expect(count.unset).toBe(0);
  });

  it("calls everything unset with no ceiling", () => {
    const count = countAgainst(LISTINGS, null);
    expect(count.unset).toBe(LISTINGS.length);
    expect(count.inside + count.depends + count.over).toBe(0);
  });

  it("counts what it is given and nothing more", () => {
    // The caller drops a home at stage gone. This function does not know
    // about stages and must not filter on its own.
    const count = countAgainst([], ceiling);
    expect(count).toEqual({ inside: 0, depends: 0, over: 0, unset: 0, of: 0 });
  });
});

describe("verdictLabel", () => {
  it("has a word for each verdict she can act on, and none for the one she cannot", () => {
    expect(verdictLabel("inside")).toBe("Inside");
    expect(verdictLabel("depends")).toBe("Turns on your sale");
    expect(verdictLabel("over")).toBe("Over");
    expect(verdictLabel("unset")).toBe("");
  });

  it("never uses the live product's two words for a blank", () => {
    for (const v of ["inside", "depends", "over", "unset"] as Verdict[]) {
      expect(verdictLabel(v)).not.toContain("Insufficient data");
    }
  });
});

describe("budgetLine", () => {
  const some: BudgetCount = { inside: 0, depends: 0, over: 0, unset: 13, of: 13 };

  it("names what is missing and how to supply it while there is no ceiling", () => {
    const line = budgetLine(some, null);
    expect(line).toContain("your own house");
    expect(line).toContain("Add the home you would be selling");
    expect(line).not.toContain("Insufficient data");
  });

  it("keeps the grammar right for one of each", () => {
    expect(budgetLine({ inside: 1, depends: 1, over: 1, unset: 0, of: 3 }, ceiling)).toBe(
      "One of the three you can still buy is inside. One turns on your sale, one is over.",
    );
  });

  it("uses plural verbs past one", () => {
    expect(budgetLine({ inside: 2, depends: 3, over: 2, unset: 0, of: 7 }, ceiling)).toBe(
      "Two of the seven you can still buy are inside. Three turn on your sale, two are over.",
    );
  });

  it("drops a clause whose count is zero rather than writing zero", () => {
    expect(budgetLine({ inside: 2, depends: 0, over: 1, unset: 0, of: 3 }, ceiling)).toBe(
      "Two of the three you can still buy are inside. One is over.",
    );
    expect(budgetLine({ inside: 2, depends: 1, over: 0, unset: 0, of: 3 }, ceiling)).toBe(
      "Two of the three you can still buy are inside. One turns on your sale.",
    );
  });

  it("says none when nothing is inside, since that is the headline", () => {
    expect(budgetLine({ inside: 0, depends: 2, over: 1, unset: 0, of: 3 }, ceiling)).toBe(
      "None of the three you can still buy are inside. Two turn on your sale, one is over.",
    );
  });

  it("does not say five of the five", () => {
    expect(budgetLine({ inside: 5, depends: 0, over: 0, unset: 0, of: 5 }, ceiling)).toBe(
      "All five you can still buy are inside.",
    );
    expect(budgetLine({ inside: 1, depends: 0, over: 0, unset: 0, of: 1 }, ceiling)).toBe(
      "The one you can still buy is inside.",
    );
  });

  it("reads the whole fixture without a numeral at the start of a sentence", () => {
    const line = budgetLine(countAgainst(LISTINGS, ceiling), ceiling);
    expect(line).toBe(
      "Five of the 13 you can still buy are inside. Five turn on your sale, three are over.",
    );
  });

  it("never shouts", () => {
    const lines = [
      budgetLine(some, null),
      budgetLine(countAgainst(LISTINGS, ceiling), ceiling),
      ceilingLine(ceiling),
    ];
    for (const line of lines) expect(line).not.toMatch(/!/);
  });
});

describe("ceilingLine", () => {
  it("gives the bracket, what it rests on, and who has not signed it", () => {
    expect(ceilingLine(ceiling)).toBe(
      "A ceiling of $1,190,000 to $1,290,000 - a bracket for your semi, less what you owe, plus the payment you named. No lender has seen it.",
    );
  });

  it("stays ASCII, because it will be read back to a lender", () => {
    expect(ceilingLine(ceiling)).toMatch(/^[\x20-\x7e]+$/);
  });
});
