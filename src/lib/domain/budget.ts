import type { CeilingInputs } from "@/data/budget";
import type { Listing } from "@/data/listings";
import { formatRange, spelled } from "./format";
import { sourced, type Sourced } from "./provenance";
import type { ConfidenceBand } from "./types";

/**
 * How a saved home is held against what she can spend.
 *
 * The ceiling is the one number on the saved page that is about her rather
 * than about a house, and it is the number most likely to be read as a
 * promise. Three rules from the brief meet here, and each is a line of code
 * rather than a convention.
 *
 * Confidence is shown, not hidden. The semi is a bracket, so the ceiling is a
 * bracket, and nothing in this file computes a midpoint. The band is moderate
 * and `shouldWithholdMidpoint` would permit one; the design withholds it
 * anyway, because two figures with "to" between them cannot be quoted to a
 * lender as if they were one. A test asserts the key does not exist.
 *
 * Every number carries provenance. Each end of the ceiling is `computed` from
 * the named figures it rests on, and `rests` hands those figures back to the
 * UI with their own provenance still attached, so a mock figure is labelled a
 * mock figure wherever it is drawn.
 *
 * The middle is never rounded inside. A home priced between the two ends
 * turns on what her own house sells for, and the verdict says exactly that.
 * Calling it "inside" would be the product agreeing with her hopes. And while
 * she has not given us her house, every verdict is `unset` and the copy names
 * what is missing rather than printing a blank.
 */

export interface Ceiling {
  low: Sourced<number>;
  high: Sourced<number>;
  band: ConfidenceBand;
  /**
   * One clause per figure, in the order they move the answer. Label in her
   * words. The bracket is two figures, so it is two clauses, both signed
   * `bracket`, low end first; a renderer draws them as one row with "to"
   * between, and a renderer that does not still shows both ends rather than
   * one of them dressed as a number.
   */
  rests: readonly {
    label: string;
    value: Sourced<number>;
    sign: "plus" | "less" | "bracket";
  }[];
}

/** The labels, once, so the clauses and the provenance cannot disagree. */
const LABEL = {
  bracket: "A semi like yours, in Bendale",
  owing: "Less what you owe",
  costs: "Less what it costs to move",
  savings: "Plus what you have put by",
  mortgage: "Plus the payment you named",
} as const;

/**
 * Deliberately returns no midpoint. The band is moderate; the design obeys
 * `shouldWithholdMidpoint` by never computing one.
 *
 * low = bracket.low - owing - costs + savings + mortgage; high likewise with
 * bracket.high. The four fixed figures are the same at both ends, so the
 * ceiling is exactly as wide as the bracket it rests on.
 */
export function ceilingFrom(inputs: CeilingInputs): Ceiling {
  const rests: Ceiling["rests"] = [
    { label: LABEL.bracket, value: inputs.bracket.low, sign: "bracket" },
    { label: LABEL.bracket, value: inputs.bracket.high, sign: "bracket" },
    { label: LABEL.owing, value: inputs.owing, sign: "less" },
    { label: LABEL.costs, value: inputs.costs, sign: "less" },
    { label: LABEL.savings, value: inputs.savings, sign: "plus" },
    { label: LABEL.mortgage, value: inputs.mortgage, sign: "plus" },
  ];
  // The bracket's two clauses share a label; provenance names each input once.
  const from = Array.from(new Set(rests.map((r) => r.label)));
  const end = (bracketEnd: Sourced<number>): Sourced<number> =>
    sourced(
      bracketEnd.value -
        inputs.owing.value -
        inputs.costs.value +
        inputs.savings.value +
        inputs.mortgage.value,
      { kind: "computed", from },
    );
  return {
    low: end(inputs.bracket.low),
    high: end(inputs.bracket.high),
    band: inputs.band,
    rests,
  };
}

export type Verdict = "inside" | "depends" | "over" | "unset";

/**
 * Where one asking price sits against the ceiling.
 *
 * Strictly below the low end is inside; strictly above the high end is over.
 * Everything else, both ends included, turns on her sale. A price that lands
 * exactly on the low end is not inside: it is inside only if her semi fetches
 * the least the bracket allows, and that is a condition, not an answer.
 */
export function verdictFor(
  price: Sourced<number>,
  ceiling: Ceiling | null,
): Verdict {
  if (!ceiling) return "unset";
  if (price.value < ceiling.low.value) return "inside";
  if (price.value > ceiling.high.value) return "over";
  return "depends";
}

export interface BudgetCount {
  inside: number;
  depends: number;
  over: number;
  unset: number;
  of: number;
}

/**
 * Counts what it is given. The caller decides which homes are still buyable -
 * a home at stage `gone` is somebody else's and should not be in the list.
 */
export function countAgainst(
  listings: readonly Listing[],
  ceiling: Ceiling | null,
): BudgetCount {
  const count: BudgetCount = {
    inside: 0,
    depends: 0,
    over: 0,
    unset: 0,
    of: listings.length,
  };
  for (const listing of listings) {
    count[verdictFor(listing.askingPrice, ceiling)] += 1;
  }
  return count;
}

/** The chip on a card. Empty for unset, because a chip that says "unknown" on every card is wallpaper. */
const VERDICT_LABEL: Record<Verdict, string> = {
  inside: "Inside",
  depends: "Turns on your sale",
  over: "Over",
  unset: "",
};

export function verdictLabel(v: Verdict): string {
  return VERDICT_LABEL[v];
}

/**
 * What the page says when it has no ceiling. Names the missing thing and the
 * one action that supplies it. Never a bare blank, and never the two words
 * the live product uses for one.
 */
const UNSET_LINE =
  "Every price here is a guess against your budget until your own house has a number on it. Add the home you would be selling and each one gets a straight answer.";

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * The first sentence always carries the denominator, even when nothing is
 * inside - "none of the eight" is the headline in that case, not a clause to
 * drop. The zero-drop rule applies to the second sentence.
 */
function headline(count: BudgetCount): string {
  const of = spelled(count.of);
  if (count.inside === 0) return `None of the ${of} you can still buy are inside.`;
  if (count.inside === count.of) {
    return count.of === 1
      ? "The one you can still buy is inside."
      : `All ${of} you can still buy are inside.`;
  }
  const verb = count.inside === 1 ? "is" : "are";
  return `${capitalise(spelled(count.inside))} of the ${of} you can still buy ${verb} inside.`;
}

/**
 * One sentence pair for the top of the list. A clause whose count is zero is
 * dropped rather than written as "zero", and one of anything gets a singular
 * verb: "one turns on your sale", "one is over".
 */
export function budgetLine(count: BudgetCount, ceiling: Ceiling | null): string {
  if (!ceiling) return UNSET_LINE;
  if (count.of === 0) return "Nothing left here to hold against your ceiling.";
  const tail: string[] = [];
  if (count.depends > 0) {
    tail.push(
      `${spelled(count.depends)} ${count.depends === 1 ? "turns" : "turn"} on your sale`,
    );
  }
  if (count.over > 0) {
    tail.push(`${spelled(count.over)} ${count.over === 1 ? "is" : "are"} over`);
  }
  const head = headline(count);
  return tail.length === 0 ? head : `${head} ${capitalise(tail.join(", "))}.`;
}

/**
 * The ceiling in one line, with what it rests on and who has not signed it.
 * A spaced hyphen rather than a dash, because everything in `format.ts` is
 * ASCII and this line will be read back to a lender.
 */
export function ceilingLine(ceiling: Ceiling): string {
  return `A ceiling of ${formatRange(ceiling.low.value, ceiling.high.value)} - a bracket for your semi, less what you owe, plus the payment you named. No lender has seen it.`;
}
