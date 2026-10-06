/**
 * Certainty: ranges versus points.
 *
 * The brief lists this as the first lever on the Certainty dimension, and
 * CLAUDE.md turns it into a rule: a valuation claiming more certainty than it
 * has is worse than none. `shouldWithholdMidpoint` already decides the extreme
 * case. This decides the whole scale, because the honest answer is not binary -
 * a moderate band can carry a bracket while having no business leading with a
 * single figure.
 *
 * The point of returning a union rather than a boolean is that a component
 * cannot render the wrong shape by accident. There is no code path from
 * `insufficient` to a number on screen.
 */

import { formatCurrency, formatRange } from "./format";
import type { Valuation } from "./types";

export type Disclosure =
  /** Enough evidence to lead with a single figure, with the bracket behind it. */
  | { kind: "point"; midpoint: number; low: number; high: number }
  /** A bracket only. Real, usable, and not a number to quote as "the" value. */
  | { kind: "range"; low: number; high: number }
  /** No figure at all, and the reason why said out loud. */
  | { kind: "withheld"; reason: string };

/**
 * What the product is allowed to show for a valuation.
 *
 * Only `high` earns a point estimate. Moderate and low get the bracket, which
 * is not a downgrade so much as an accurate rendering: when recent sales
 * disagree by 15%, the midpoint is arithmetic rather than evidence.
 */
export function discloseValuation(
  v: Pick<Valuation, "band" | "midpoint" | "low" | "high">,
): Disclosure {
  if (v.band === "insufficient") {
    return {
      kind: "withheld",
      /*
       * Deliberately not BAND_COPY.insufficient.blurb: the confidence band
       * renders that same sentence directly underneath, and a refusal stated
       * twice reads as a component bug rather than a position.
       */
      reason:
        "A figure here would be a guess with a dollar sign in front of it. The reasons are below, and they are the useful part.",
    };
  }
  if (v.band === "high") {
    return { kind: "point", midpoint: v.midpoint, low: v.low, high: v.high };
  }
  return { kind: "range", low: v.low, high: v.high };
}

/** The headline string for a disclosure. Null when there is no figure to give. */
export function disclosureFigure(d: Disclosure): string | null {
  switch (d.kind) {
    case "point":
      return formatCurrency(d.midpoint);
    case "range":
      return formatRange(d.low, d.high);
    case "withheld":
      return null;
  }
}

/**
 * The line under the headline. A point estimate owes the reader its bracket;
 * a bracket owes them nothing further, and saying "this is a range" under a
 * range is the kind of caption that trains people to stop reading captions.
 */
export function disclosureCaption(d: Disclosure): string | null {
  switch (d.kind) {
    case "point":
      return `Comparable sales support ${formatRange(d.low, d.high)}.`;
    case "range":
      return "Shown as a bracket rather than a single figure. Recent sales do not agree closely enough for a midpoint to mean anything.";
    case "withheld":
      return null;
  }
}
