import { describe, expect, it } from "vitest";
import { assessConfidence, shouldWithholdMidpoint } from "./confidence";
import type { Comparable } from "./types";

const ASOF = new Date("2026-09-06");

function comp(overrides: Partial<Comparable> = {}): Comparable {
  return {
    id: crypto.randomUUID(),
    address: "100 Example St",
    unitType: "one-bed",
    sqft: 545,
    soldPrice: 520_000,
    soldOn: "2026-08-01",
    sameBuilding: true,
    adjustments: [],
    ...overrides,
  };
}

describe("assessConfidence", () => {
  it("returns high only when the comps are many, recent, close and in-building", () => {
    const result = assessConfidence({
      comparables: Array.from({ length: 5 }, (_, i) =>
        comp({ soldPrice: 515_000 + i * 3_000 }),
      ),
      asOf: ASOF,
    });
    expect(result.band).toBe("high");
    expect(result.reasons).toHaveLength(1);
  });

  it("refuses a number when there are no comps at all", () => {
    const result = assessConfidence({ comparables: [], asOf: ASOF });
    expect(result.band).toBe("insufficient");
    expect(shouldWithholdMidpoint({ band: result.band })).toBe(true);
  });

  it("refuses a number when too few recent comps survive the staleness cut", () => {
    const result = assessConfidence({
      comparables: [
        comp({ soldOn: "2026-08-01" }),
        comp({ soldOn: "2024-01-01" }),
        comp({ soldOn: "2023-06-01" }),
      ],
      asOf: ASOF,
    });
    expect(result.band).toBe("insufficient");
    expect(result.reasons.join(" ")).toMatch(/different market/);
  });

  it("downgrades and explains when recent sales disagree with each other", () => {
    const result = assessConfidence({
      comparables: [
        comp({ soldPrice: 430_000 }),
        comp({ soldPrice: 520_000 }),
        comp({ soldPrice: 610_000 }),
      ],
      asOf: ASOF,
    });
    expect(result.band).not.toBe("high");
    expect(result.reasons.join(" ")).toMatch(/disagree with each other by \d+%/);
  });

  it("drops to low when an atypical unit has no in-building comps", () => {
    const result = assessConfidence({
      comparables: Array.from({ length: 5 }, () => comp({ sameBuilding: false })),
      asOf: ASOF,
      atypicalUnit: true,
    });
    expect(result.band).toBe("low");
    expect(result.reasons.length).toBeGreaterThanOrEqual(2);
  });

  it("always gives a human-readable reason for anything short of high", () => {
    const result = assessConfidence({
      comparables: [comp({ sameBuilding: false }), comp({ sameBuilding: false }), comp({ sameBuilding: false })],
      asOf: ASOF,
    });
    expect(result.band).not.toBe("high");
    for (const reason of result.reasons) {
      expect(reason.length).toBeGreaterThan(20);
      expect(reason).toMatch(/[.]$/);
    }
  });
});
