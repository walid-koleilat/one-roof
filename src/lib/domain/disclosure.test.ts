import { describe, expect, it } from "vitest";
import {
  discloseValuation,
  disclosureCaption,
  disclosureFigure,
} from "./disclosure";
import { BAND_COPY } from "./confidence";
import type { ConfidenceBand } from "./types";

const valuation = (band: ConfidenceBand) => ({
  band,
  midpoint: 586_000,
  low: 568_000,
  high: 604_000,
});

describe("discloseValuation", () => {
  it("gives a point estimate only at high confidence", () => {
    const d = discloseValuation(valuation("high"));
    expect(d.kind).toBe("point");
    expect(disclosureFigure(d)).toBe("$586,000");
  });

  it("drops to a bracket at moderate, where the midpoint is arithmetic not evidence", () => {
    const d = discloseValuation(valuation("moderate"));
    expect(d.kind).toBe("range");
    expect(disclosureFigure(d)).toBe("$568,000 to $604,000");
  });

  it("still gives a bracket at low, because a rough answer beats no answer", () => {
    expect(discloseValuation(valuation("low")).kind).toBe("range");
  });

  it("withholds every figure when the band is insufficient", () => {
    const d = discloseValuation(valuation("insufficient"));
    expect(d.kind).toBe("withheld");
    expect(disclosureFigure(d)).toBeNull();
  });

  it("never leaks a midpoint below high confidence", () => {
    const leaked = (["moderate", "low", "insufficient"] as const)
      .map((band) => disclosureFigure(discloseValuation(valuation(band))))
      .filter((figure) => figure?.includes("586,000"));
    expect(leaked).toEqual([]);
  });
});

describe("disclosureCaption", () => {
  it("owes the reader a bracket under a point estimate", () => {
    const caption = disclosureCaption(discloseValuation(valuation("high")));
    expect(caption).toContain("$568,000 to $604,000");
  });

  it("says why a bracket is a bracket", () => {
    const caption = disclosureCaption(discloseValuation(valuation("moderate")));
    expect(caption).toContain("do not agree closely enough");
  });

  it("has no caption where there is no figure", () => {
    expect(
      disclosureCaption(discloseValuation(valuation("insufficient"))),
    ).toBeNull();
  });
});

describe("the refusal", () => {
  it("does not repeat the confidence blurb, which renders directly underneath it", () => {
    const d = discloseValuation(valuation("insufficient"));
    const reason = d.kind === "withheld" ? d.reason : "";
    expect(reason).not.toBe(BAND_COPY.insufficient.blurb);
    expect(reason.length).toBeGreaterThan(0);
  });
});
