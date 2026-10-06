import type { Comparable } from "@/lib/domain/types";
import type { Provenance } from "@/lib/domain/provenance";

/**
 * Comparable sales for the worked example: a 612 sq ft one-bedroom in a
 * mid-2010s downtown tower.
 *
 * These are INVENTED. Real comps would come from the VOW feed, which cannot be
 * redistributed, so the prototype carries a plausible set instead and labels it
 * every time it is rendered. Nothing here should ever appear without the tag.
 */
export const COMPS_PROVENANCE: Provenance = {
  kind: "mock",
  note: "Plausible comparable sales invented for the prototype. Real comps come from the VOW feed and cannot be redistributed.",
};

export const SAMPLE_COMPS: Comparable[] = [
  {
    id: "comp-1204",
    address: "88 Blue Jays Way, Unit 1204",
    unitType: "one-bed",
    sqft: 598,
    soldPrice: 542_000,
    soldOn: "2026-07-18",
    sameBuilding: true,
    adjustments: [
      { reason: "14 sq ft smaller than yours", amount: 6_500 },
      { reason: "No parking; yours has one space", amount: 38_000 },
      { reason: "Lower floor, no lake view", amount: 12_000 },
    ],
  },
  {
    id: "comp-2711",
    address: "88 Blue Jays Way, Unit 2711",
    unitType: "one-bed",
    sqft: 621,
    soldPrice: 601_000,
    soldOn: "2026-06-02",
    sameBuilding: true,
    adjustments: [
      { reason: "Nine floors higher", amount: -14_000 },
      { reason: "Renovated kitchen, 2024", amount: -9_500 },
    ],
  },
  {
    id: "comp-0906",
    address: "12 Widmer St, Unit 906",
    unitType: "one-bed",
    sqft: 605,
    soldPrice: 568_500,
    soldOn: "2026-05-21",
    sameBuilding: false,
    adjustments: [
      { reason: "Newer building, 2021 completion", amount: -21_000 },
      { reason: "No parking; yours has one space", amount: 38_000 },
    ],
  },
  {
    id: "comp-1508",
    address: "8 Mercer St, Unit 1508",
    unitType: "one-bed",
    sqft: 634,
    soldPrice: 585_000,
    soldOn: "2026-04-09",
    sameBuilding: false,
    adjustments: [{ reason: "22 sq ft larger than yours", amount: -10_000 }],
  },
  {
    id: "comp-3302",
    address: "100 Harbour St, Unit 3302",
    unitType: "one-bed",
    sqft: 590,
    soldPrice: 559_000,
    soldOn: "2026-03-14",
    sameBuilding: false,
    adjustments: [
      { reason: "Waterfront building commands a premium", amount: -18_000 },
      { reason: "Locker included; yours has none", amount: -4_000 },
    ],
  },
];
