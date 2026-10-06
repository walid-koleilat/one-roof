import type { Sourced } from "./provenance";

/** The four stages from the build brief. The space is one object at four stages. */
export type Stage = "discovery" | "orientation" | "decision" | "execution";

export type UnitType =
  | "bachelor"
  | "one-bed"
  | "one-bed-den"
  | "two-bed"
  | "three-bed";

export type Region = "416" | "905";

/**
 * Why the number has to survive an argument. This is the qualification signal
 * the brief cares about, and it is DECLARED - never inferred from behaviour.
 */
export type Counterparty =
  | "lawyer"
  | "sibling-or-executor"
  | "cra"
  | "lender"
  | "former-partner"
  | "none-stated";

/** How fast the clock actually is. The advice inverts on this. */
export type Horizon = "now" | "under-6-months" | "six-to-18-months" | "can-hold";

/**
 * What the user declared. Absent until they say it out loud.
 * The brief is explicit: declared, never inferred.
 */
export interface Declaration {
  horizon: Horizon;
  counterparty: Counterparty;
  declaredAt: string;
}

export type ConfidenceBand = "high" | "moderate" | "low" | "insufficient";

export interface Comparable {
  id: string;
  address: string;
  unitType: UnitType;
  sqft: number;
  soldPrice: number;
  soldOn: string;
  /** Distance in the building/area sense, used to explain weighting. */
  sameBuilding: boolean;
  /** Signed dollar adjustments applied to make this comp comparable. */
  adjustments: Array<{ reason: string; amount: number }>;
}

export interface Valuation {
  /** Point estimate. Never shown without its band. */
  midpoint: number;
  low: number;
  high: number;
  band: ConfidenceBand;
  /** Plain-language reasons the band is what it is. Shown, not hidden. */
  reasons: string[];
  comparables: Comparable[];
  asOf: string;
}

export interface MarketSlice {
  region: Region;
  unitType: UnitType;
  averagePrice: Sourced<number>;
  yearOverYear: Sourced<number>;
  monthsOfInventory: Sourced<number>;
  peakToTrough: Sourced<number>;
}

/** S5: the handoff card. A lead instead of a stranger. */
export interface AgentBrief {
  declaredAt: string;
  situation: string;
  valuationBasis: string;
  deadline: string | null;
  horizon: Horizon;
  counterparty: Counterparty;
}
