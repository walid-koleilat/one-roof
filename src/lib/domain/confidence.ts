import type { Comparable, ConfidenceBand, Valuation } from "./types";

/**
 * The rules that decide how much certainty a valuation is allowed to claim.
 *
 * The brief is blunt about why this exists: the typical portal estimate
 * grades C- because it "shows a number with no comps, no confidence and no
 * explanation", and a valuation claiming more certainty than it has "is worse
 * than none". So the failure states are first-class here, not an afterthought,
 * and every downgrade produces a sentence a human can read.
 */

export const MIN_COMPS_FOR_HIGH = 5;
export const MIN_COMPS_FOR_MODERATE = 3;
/** Past this, a comp is describing a different market, not this one. */
export const STALE_COMP_DAYS = 180;
/** Spread wider than this means the comps disagree with each other. */
export const WIDE_SPREAD_RATIO = 0.18;

export interface ConfidenceInput {
  comparables: Comparable[];
  /** Evaluation date, injected so the rules are testable. */
  asOf: Date;
  /** True for units the comp set structurally cannot cover (penthouse, live-work). */
  atypicalUnit?: boolean;
}

export interface ConfidenceResult {
  band: ConfidenceBand;
  reasons: string[];
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 86_400_000;
}

/**
 * Returns the band plus the plain-language reasons for it. The reasons are the
 * product, not debug output - S6 renders them verbatim.
 */
export function assessConfidence({
  comparables,
  asOf,
  atypicalUnit = false,
}: ConfidenceInput): ConfidenceResult {
  const reasons: string[] = [];

  const fresh = comparables.filter(
    (c) => daysBetween(new Date(c.soldOn), asOf) <= STALE_COMP_DAYS,
  );
  const stale = comparables.length - fresh.length;

  if (comparables.length === 0) {
    return {
      band: "insufficient",
      reasons: [
        "No comparable sales found for this unit type in this building or area.",
      ],
    };
  }

  if (stale > 0) {
    reasons.push(
      `${stale} of ${comparables.length} comparable sales are more than ${STALE_COMP_DAYS} days old, which means they priced a different market than today's.`,
    );
  }

  if (fresh.length < MIN_COMPS_FOR_MODERATE) {
    reasons.push(
      `Only ${fresh.length} recent comparable ${fresh.length === 1 ? "sale" : "sales"} - too few to place a reliable range around.`,
    );
    return { band: "insufficient", reasons };
  }

  if (atypicalUnit) {
    reasons.push(
      "This unit is unusual for the building, so comparable sales describe it less well than they normally would.",
    );
  }

  const prices = fresh.map((c) => c.soldPrice);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const mid = (low + high) / 2;
  const spread = mid === 0 ? 0 : (high - low) / mid;

  if (spread > WIDE_SPREAD_RATIO) {
    reasons.push(
      `Recent sales disagree with each other by ${Math.round(spread * 100)}%, which is wide enough that the midpoint is not a strong signal.`,
    );
  }

  const sameBuilding = fresh.filter((c) => c.sameBuilding).length;
  if (sameBuilding === 0) {
    reasons.push(
      "No recent sales in this building, so the range leans on nearby buildings that may not price the same way.",
    );
  }

  const downgrades = Number(atypicalUnit) + Number(spread > WIDE_SPREAD_RATIO) + Number(sameBuilding === 0) + Number(stale > 0);

  if (fresh.length >= MIN_COMPS_FOR_HIGH && downgrades === 0) {
    return {
      band: "high",
      reasons: [
        `${fresh.length} recent comparable sales, ${sameBuilding} of them in this building, priced within ${Math.round(spread * 100)}% of each other.`,
      ],
    };
  }

  if (downgrades >= 2) return { band: "low", reasons };
  return { band: "moderate", reasons };
}

/**
 * A band a human can act on, and the one place the copy for it lives.
 *
 * `verdict` is the one-word layer of the value-block anatomy: the reader gets
 * the answer before they read the figure. `blurb` is the sentence underneath.
 */
export const BAND_COPY: Record<
  ConfidenceBand,
  { label: string; verdict: string; blurb: string }
> = {
  high: {
    label: "High confidence",
    verdict: "Defensible",
    blurb: "Enough recent, close comparable sales to defend this range.",
  },
  moderate: {
    label: "Moderate confidence",
    verdict: "Usable",
    blurb: "Usable, with caveats worth reading before you quote it to anyone.",
  },
  low: {
    label: "Low confidence",
    verdict: "Rough",
    blurb:
      "Treat this as a rough bracket, not a number to take into a negotiation.",
  },
  insufficient: {
    label: "Not enough to give you a number",
    verdict: "Unknown",
    blurb:
      "We would rather say so than show you a figure that will not survive scrutiny.",
  },
};

/** Band order, weakest last. Used wherever bands are laid out as a scale. */
export const BAND_ORDER: readonly ConfidenceBand[] = [
  "high",
  "moderate",
  "low",
  "insufficient",
] as const;

/** True when the product should refuse to lead with a point estimate. */
export function shouldWithholdMidpoint(v: Pick<Valuation, "band">): boolean {
  return v.band === "insufficient";
}
