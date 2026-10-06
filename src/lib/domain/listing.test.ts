import { describe, expect, it } from "vitest";
import {
  isVerified,
  metricsLine,
  priceDelta,
  suiteLabel,
  type SuiteStatus,
} from "./listing";

describe("priceDelta", () => {
  it("reads under when the asking price sits below our estimate", () => {
    const delta = priceDelta(1_189_000, 1_203_000);
    expect(delta.tone).toBe("under");
    expect(delta.label).toBe("$14k under");
    expect(delta.amount).toBe(-14_000);
  });

  it("reads over when the asking price sits above it", () => {
    const delta = priceDelta(1_344_000, 1_340_000);
    expect(delta.tone).toBe("over");
    expect(delta.label).toBe("$4k over");
  });

  it("collapses noise to At estimate rather than printing a tiny number", () => {
    // $900 on $1.2m is inside the tolerance. Printing it would claim a
    // precision the estimate does not have.
    expect(priceDelta(1_275_900, 1_275_000).label).toBe("At estimate");
    expect(priceDelta(1_274_100, 1_275_000).label).toBe("At estimate");
  });

  it("treats an exact match as At estimate", () => {
    expect(priceDelta(1_000_000, 1_000_000).tone).toBe("at");
  });

  it("honours a caller-supplied tolerance", () => {
    expect(priceDelta(1_010_000, 1_000_000, 20_000).tone).toBe("at");
    expect(priceDelta(1_010_000, 1_000_000, 5_000).tone).toBe("over");
  });
});

describe("suiteLabel", () => {
  it("never describes an unpermitted unit as legal", () => {
    for (const status of [
      "ground-floor",
      "could-convert",
      "no-permit",
    ] as SuiteStatus[]) {
      expect(suiteLabel(status).toLowerCase()).not.toContain("legal");
    }
  });

  it("names the missing permit, since that is the one a buyer must act on", () => {
    expect(suiteLabel("no-permit")).toContain("no permit");
  });

  it("describes the permitted one in plain words, not in filing terms", () => {
    expect(suiteLabel("legal-suite")).toBe("Own kitchen and own door");
  });
});

describe("isVerified", () => {
  it("is true for both shapes the city has a record of", () => {
    expect(isVerified("legal-suite")).toBe(true);
    expect(isVerified("ground-floor")).toBe(true);
  });

  it("is the whole basis for the card's colour, and it is about safety", () => {
    // Not about money. An earlier version had a second predicate for whether
    // a lender would count the rent; her parents live in the suite, so there
    // is no rent, and the idea was removed rather than left to mislead.
    expect(isVerified("legal-suite")).toBe(true);
    expect(isVerified("no-permit")).toBe(false);
  });

  it("is false for a kitchen nobody has checked", () => {
    expect(isVerified("no-permit")).toBe(false);
    expect(isVerified("could-convert")).toBe(false);
  });

});

describe("metricsLine", () => {
  const four = { beds: 4, baths: 3, kitchens: 2, lot: "41 x 128 ft" };

  it("leads with kitchens present, because two households need two", () => {
    expect(metricsLine(four)).toBe("4 bed · 3 bath · 2 kitchens · 41 x 128 ft lot");
  });

  it("says one kitchen, not one kitchens", () => {
    expect(metricsLine({ ...four, kitchens: 1 })).toContain("1 kitchen ·");
  });

  it("drops the lot when compact, since a 230px card would wrap", () => {
    expect(metricsLine(four, { compact: true })).toBe("4 bed · 3 bath · 2 kitchens");
  });
});
