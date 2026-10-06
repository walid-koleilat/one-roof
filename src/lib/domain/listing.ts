import { formatCurrencyCompact } from "./format";

/**
 * How a listing is described to a multigenerational buyer.
 *
 * Two decisions live here rather than in a component, because both are claims
 * about the world rather than about layout.
 *
 * The first is `suiteStatus`. "Legal suite" and "kitchen downstairs" are not
 * the same thing, and the difference is whether anybody has checked the fire
 * separation and the way out of the bedroom. A card that renders those two the
 * same way is telling the user something false, so the status is a closed
 * union and every branch has to be handled.
 *
 * The second is the price delta. "$14k under" is a comparison to our own
 * estimate, not to anything the seller published, and the tone attached to it
 * is semantic: `under` is not "good news", it is "the asking price sits below
 * where we think the market is", which is exactly as interesting to someone
 * who is about to be outbid.
 */

/** What the house actually is, in the only terms that change the mortgage. */
export type SuiteStatus =
  /** A second unit with its own kitchen and door, and a permit at the city. */
  | "legal-suite"
  /** Bed and full bath at ground level. No second kitchen, and no stairs. */
  | "ground-floor"
  /** Height and windows meet code. Nobody has pulled the permit. */
  | "could-convert"
  /** A kitchen and a side door, and no permit on record for either. */
  | "no-permit";

/**
 * Written the way she would say it, not the way the industry does.
 *
 * The permit is still the fact underneath - it is what `countsForMortgage`
 * turns on - but a card that leads with "permit on file" is asking her to
 * learn a filing system before she can read a house. "Own kitchen and own
 * door" is the same claim in words she already has.
 */
const SUITE_LABEL: Record<SuiteStatus, string> = {
  "legal-suite": "Own kitchen and own door",
  "ground-floor": "Bed and bath on the ground floor",
  "could-convert": "Room to add a suite later",
  "no-permit": "Kitchen downstairs, no permit",
};

export function suiteLabel(status: SuiteStatus): string {
  return SUITE_LABEL[status];
}

/**
 * True when somebody official has looked at the space.
 *
 * This is what the card colours on. A permitted suite has been inspected for
 * fire separation and an exit window; a ground-floor bedroom is an ordinary
 * room with nothing to inspect. Both are safe. A basement that "could become
 * one" and a kitchen with no permit have not been checked by anyone, and that
 * is the distinction that matters when the person sleeping there fell in
 * March.
 */
export function isVerified(status: SuiteStatus): boolean {
  return status === "legal-suite" || status === "ground-floor";
}

/**
 * The counts a multigenerational buyer reads before anything else.
 *
 * Kitchens is in here and bedrooms is not first, because two kitchens is the
 * difference between two households and one crowded one. A portal that leads
 * with beds and baths is answering a question she is not asking.
 */
export interface Metrics {
  beds: number;
  baths: number;
  kitchens: number;
  /** Frontage by depth in feet. A laneway suite lives or dies on this. */
  lot: string;
}

/**
 * `compact` drops the lot. In a 230px card the full line wraps to two, and the
 * lot is the one metric that only matters once she is thinking about building,
 * which is not what an advert is for.
 */
export function metricsLine(m: Metrics, { compact = false } = {}): string {
  const kitchens = `${m.kitchens} ${m.kitchens === 1 ? "kitchen" : "kitchens"}`;
  const head = `${m.beds} bed · ${m.baths} bath · ${kitchens}`;
  return compact ? head : `${head} · ${m.lot} lot`;
}

export type DeltaTone = "under" | "at" | "over";

export interface PriceDelta {
  tone: DeltaTone;
  /** "$14k under", "At estimate", "$4k over". */
  label: string;
  /** Signed dollars. Positive means the asking price is above our estimate. */
  amount: number;
}

/**
 * Compare an asking price to our own estimate.
 *
 * Anything inside `tolerance` reads as "At estimate" rather than as a tiny
 * number, because $900 on $1.2m is noise and printing it invites the reader to
 * treat our estimate as more precise than it is.
 */
export function priceDelta(
  askingPrice: number,
  ourEstimate: number,
  tolerance = 2_000,
): PriceDelta {
  const amount = askingPrice - ourEstimate;
  if (Math.abs(amount) <= tolerance) {
    return { tone: "at", label: "At estimate", amount };
  }
  const size = formatCurrencyCompact(Math.abs(amount));
  return {
    tone: amount < 0 ? "under" : "over",
    label: `${size} ${amount < 0 ? "under" : "over"}`,
    amount,
  };
}
