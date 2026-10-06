/**
 * Agency: what the default assumes, and how to unsay it.
 *
 * The brief's Agency dimension runs from "this is happening to me" to "I am
 * choosing this", and two of its four levers are about defaults rather than
 * choices. A product that quietly assumes an eighteen-month horizon and prices
 * accordingly has made the decision for the user. The same product that says
 * "we are assuming you can hold; change that" has handed it back.
 *
 * So the assumption is a named, exported value rather than a literal buried in
 * a calculation, and every declaration knows how to describe itself in a
 * sentence the user can check.
 */

import { formatDate } from "./format";
import type { Counterparty, Declaration, Horizon } from "./types";

export const HORIZON_COPY: Record<
  Horizon,
  { label: string; short: string; consequence: string }
> = {
  now: {
    label: "It has to be sold now",
    short: "now",
    consequence:
      "Pricing is set to clear, not to test the market. The bracket's low end is the working number.",
  },
  "under-6-months": {
    label: "Within six months",
    short: "under six months",
    consequence:
      "One pricing correction fits in that window, and only one. The first three weeks decide it.",
  },
  "six-to-18-months": {
    label: "Six to eighteen months",
    short: "six to eighteen months",
    consequence:
      "Long enough to wait out the completions clearing, short enough that 2027 is a gamble rather than a plan.",
  },
  "can-hold": {
    label: "I can hold indefinitely",
    short: "no fixed deadline",
    consequence:
      "Waiting is defensible. CMHC expects prices to resume growth from 2027 as completions taper.",
  },
};

export const COUNTERPARTY_COPY: Record<
  Counterparty,
  { label: string; why: string }
> = {
  lawyer: {
    label: "A lawyer",
    why: "The number has to survive a document, so the comps and adjustments matter more than the midpoint.",
  },
  "sibling-or-executor": {
    label: "A sibling or co-executor",
    why: "The number has to survive a conversation between people who disagree, on paper, away from this screen.",
  },
  cra: {
    label: "The CRA",
    why: "The valuation date is the thing being argued about, so it is stated everywhere the figure appears.",
  },
  lender: {
    label: "A lender",
    why: "They will run their own appraisal. The value of ours is knowing the gap before they tell you.",
  },
  "former-partner": {
    label: "A former partner",
    why: "The number has to survive someone with an interest in a different answer.",
  },
  "none-stated": {
    label: "Just me, for now",
    why: "Nothing here has to survive anyone else yet.",
  },
};

/**
 * What the product assumes before the user has said anything.
 *
 * Stated rather than silent. This is the "what the default assumes" lever: the
 * assumption is visible, attributed to us, and changeable in one action.
 */
export const UNDECLARED_ASSUMPTION = {
  horizon: "six-to-18-months",
  counterparty: "none-stated",
  sentence:
    "You have not told us the clock yet, so everything below assumes six to eighteen months and no one else to convince. Both change the answer.",
} as const satisfies { horizon: Horizon; counterparty: Counterparty; sentence: string };

export interface DeclarationSummary {
  /** One sentence describing what is currently being assumed or was declared. */
  sentence: string;
  /** True when this is our assumption rather than the user's statement. */
  assumed: boolean;
  horizon: Horizon;
  counterparty: Counterparty;
  /** What follows from the horizon. Rendered next to the summary, not hidden. */
  consequence: string;
}

/**
 * Describes the current state, declared or assumed, in the same shape either
 * way - so the UI cannot render an assumption as though the user had said it.
 */
export function summariseDeclaration(
  declaration: Declaration | null,
): DeclarationSummary {
  if (!declaration) {
    return {
      sentence: UNDECLARED_ASSUMPTION.sentence,
      assumed: true,
      horizon: UNDECLARED_ASSUMPTION.horizon,
      counterparty: UNDECLARED_ASSUMPTION.counterparty,
      consequence: HORIZON_COPY[UNDECLARED_ASSUMPTION.horizon].consequence,
    };
  }

  const horizon = HORIZON_COPY[declaration.horizon];
  const counterparty = COUNTERPARTY_COPY[declaration.counterparty];

  return {
    sentence: `You said ${horizon.short}, and that the number has to hold up to ${counterparty.label.toLowerCase()}. Recorded ${formatDate(declaration.declaredAt)}.`,
    assumed: false,
    horizon: declaration.horizon,
    counterparty: declaration.counterparty,
    consequence: horizon.consequence,
  };
}

/** Ordered for display, fastest clock first. The order is the escalation. */
export const HORIZON_ORDER: readonly Horizon[] = [
  "now",
  "under-6-months",
  "six-to-18-months",
  "can-hold",
] as const;

export const COUNTERPARTY_ORDER: readonly Counterparty[] = [
  "lawyer",
  "sibling-or-executor",
  "cra",
  "lender",
  "former-partner",
  "none-stated",
] as const;
