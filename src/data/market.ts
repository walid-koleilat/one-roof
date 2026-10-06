import { sourced } from "@/lib/domain/provenance";
import type { Sourced } from "@/lib/domain/provenance";
import type { Region, UnitType } from "@/lib/domain/types";

const TRREB = (asOf: string) => ({ kind: "published" as const, source: "TRREB", asOf });
const CMHC = (asOf: string) => ({ kind: "published" as const, source: "CMHC", asOf });
const URBANATION = (asOf: string) => ({ kind: "published" as const, source: "Urbanation", asOf });

/**
 * GTA condo apartment, August 2026. Figures verified against published market
 * data when the prototype was built.
 * A GTA average is close to meaningless on its own - see cohort data below -
 * so this exists to be contrasted against the user's own unit type, never to
 * be shown as "the market".
 */
export const REGION_SNAPSHOT: Record<
  Region,
  { averagePrice: Sourced<number>; yearOverYear: Sourced<number>; monthsOfInventory: Sourced<number> }
> = {
  "416": {
    averagePrice: sourced(651_648, TRREB("2026-08")),
    yearOverYear: sourced(-0.021, TRREB("2026-08")),
    monthsOfInventory: sourced(5.6, TRREB("2026-08")),
  },
  "905": {
    averagePrice: sourced(549_868, TRREB("2026-08")),
    yearOverYear: sourced(-0.076, TRREB("2026-08")),
    monthsOfInventory: sourced(6.6, TRREB("2026-08")),
  },
};

export const SALE_TO_LIST = sourced(0.97, TRREB("2026-08"));
export const DAYS_ON_MARKET = sourced(35, TRREB("2026-08"));

/**
 * Benchmark change by district, Apr 2022 -> Aug 2026.
 * The headline finding: downtown is not the problem. North York and
 * Scarborough are.
 */
export const DISTRICT_DECLINE: Array<{ code: string; name: string; change: Sourced<number> }> = [
  { code: "C15", name: "Bayview / Sheppard", change: sourced(-0.499, TRREB("2026-08")) },
  { code: "E09", name: "Scarborough", change: sourced(-0.488, TRREB("2026-08")) },
  { code: "C14", name: "Willowdale", change: sourced(-0.44, TRREB("2026-08")) },
  { code: "C08", name: "Moss Park / Corktown", change: sourced(-0.39, TRREB("2026-08")) },
  { code: "C01", name: "Downtown core", change: sourced(-0.365, TRREB("2026-08")) },
  { code: "TOR", name: "City of Toronto", change: sourced(-0.344, TRREB("2026-08")) },
];

/**
 * Benchmark change by unit size, Q2 2022 -> Q2 2026.
 *
 * DERIVED, and the UI must say so. These were read off published chart
 * geometry rather than a published table, which is exactly the kind of figure
 * the brief says to label rather than launder.
 */
export const COHORT_DECLINE: Record<UnitType, Sourced<number>> = {
  bachelor: sourced(-0.286, {
    kind: "derived",
    source: "Urbanation cohort chart",
    asOf: "2026-Q2",
    method: "read from chart geometry",
  }),
  "one-bed": sourced(-0.269, {
    kind: "derived",
    source: "Urbanation cohort chart",
    asOf: "2026-Q2",
    method: "read from chart geometry",
  }),
  "one-bed-den": sourced(-0.258, {
    kind: "derived",
    source: "Urbanation cohort chart",
    asOf: "2026-Q2",
    method: "read from chart geometry",
  }),
  "two-bed": sourced(-0.145, {
    kind: "derived",
    source: "Urbanation cohort chart",
    asOf: "2026-Q2",
    method: "read from chart geometry",
  }),
  "three-bed": sourced(-0.061, {
    kind: "derived",
    source: "Urbanation cohort chart",
    asOf: "2026-Q2",
    method: "read from chart geometry",
  }),
};

/** Supply pressure - the reason the CMHC forecast reads the way it does. */
export const SUPPLY = {
  completedAndUnsold: sourced(5_001, URBANATION("2026-Q2")),
  completedAndUnsoldYoY: sourced(0.68, URBANATION("2026-Q2")),
  completions2025: sourced(23_141, CMHC("2025")),
  apartmentStarts2023: sourced(37_519, CMHC("2023")),
  apartmentStarts2025: sourced(18_986, CMHC("2025")),
  /** Units completed in 2025 run this much per month above realized rents. */
  monthlyCarryGap: sourced(1_338, URBANATION("2026-Q2")),
  subFiveHundredKShareThen: sourced(0.068, TRREB("2022-08")),
  subFiveHundredKShareNow: sourced(0.393, TRREB("2026-08")),
} as const;

/**
 * The published answer to "sell now or wait" - quoted verbatim, because the
 * whole premise is that every party a Canadian can ask is paid on the answer.
 * CMHC is not.
 */
export const CMHC_POSITION = sourced(
  "the condominium market is expected to underperform as a high number of completions place downward pressure on prices... Moving into 2027, the average price is likely to resume growth as new completions taper off.",
  { kind: "published", source: "CMHC Housing Market Outlook", asOf: "2026" },
);

export const UNIT_TYPE_LABEL: Record<UnitType, string> = {
  bachelor: "Bachelor",
  "one-bed": "One bedroom",
  "one-bed-den": "One bedroom + den",
  "two-bed": "Two bedroom",
  "three-bed": "Three bedroom",
};
