import { sourced, type Sourced } from "@/lib/domain/provenance";
import type { ConfidenceBand } from "@/lib/domain/types";

/**
 * What her ceiling rests on, written down once and labelled invented.
 *
 * The saved page asks for one new thing - the house she would sell - and in
 * return it promises a straight answer on every home she has kept: inside,
 * over, or turns on the sale. That answer is a subtraction, and a subtraction
 * is only as honest as the figures under it. So the figures live here, each
 * carrying `mock` provenance that says what it stands in for, and the
 * arithmetic lives in `src/lib/domain/budget.ts` where a test can hold it.
 *
 * Nothing in this file is hers yet. The bracket is what a comps model would
 * say about a semi in Bendale. What she owes and what she has put by are
 * things she would type in. The costs are a rule of thumb. The mortgage is
 * the principal that the monthly payment she named would carry, and no lender
 * has seen it - the copy says so every time the figure appears.
 *
 * The bracket stays a bracket. `ceilingFrom` carries both ends through and
 * never averages them, because a semi that will fetch somewhere between two
 * numbers gives her a ceiling that sits somewhere between two numbers, and a
 * product that picks the middle has turned her guess into its promise.
 */

export interface CeilingInputs {
  /** What a semi like hers, in Bendale, would fetch. A bracket, from the comps model. */
  bracket: { low: Sourced<number>; high: Sourced<number> };
  /** What is still owed on it. */
  owing: Sourced<number>;
  /** Commission, lawyers, and land transfer tax on the buy - one figure. */
  costs: Sourced<number>;
  /** What they have put by. */
  savings: Sourced<number>;
  /** The principal the monthly payment she named will carry. No lender has seen it. */
  mortgage: Sourced<number>;
  band: ConfidenceBand;
}

const mock = (note: string) => ({ kind: "mock" as const, note });

/**
 * Chosen so the ceiling lands on $1,190,000 to $1,290,000 exactly, and so
 * that neither end is the asking price of any home in `listings.ts`. A
 * reader must never be able to mistake the ceiling for a house.
 */
export const CEILING_INPUTS: CeilingInputs = {
  bracket: {
    low: sourced(
      915_000,
      mock(
        "The low end of what a semi in Bendale would fetch. Stands in for the comps model's bracket: about $965,000, less five percent, which is the persona's own arithmetic.",
      ),
    ),
    high: sourced(
      1_015_000,
      mock(
        "The high end of the same bracket: about $965,000, plus five percent. Six sales is a range, not a number.",
      ),
    ),
  },
  owing: sourced(
    402_000,
    mock(
      "What is left on her mortgage. Stands in for a figure she would type in herself; nothing reads it from anywhere.",
    ),
  ),
  costs: sourced(
    62_000,
    mock(
      "Commission on the sale, two lawyers, and land transfer tax on the buy, as one figure. Stands in for a rule of thumb, not a quote.",
    ),
  ),
  savings: sourced(
    79_000,
    mock("What they have put by. Hers to state; the prototype invents it."),
  ),
  mortgage: sourced(
    660_000,
    mock(
      "The principal that the monthly payment she named would carry at today's rates. Stands in for a pre-approval that does not exist yet. No lender has seen it.",
    ),
  ),
  band: "moderate",
};
