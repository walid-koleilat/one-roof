import { describe, expect, it } from "vitest";
import { compare, rankPhrase, verdictFor, IN_LINE_RATIO } from "./signal";

describe("compare", () => {
  it("calls a small gap in line rather than inventing a finding", () => {
    const v = compare({
      value: 100,
      baseline: 100 * (1 + IN_LINE_RATIO),
      baselineLabel: "the 416 average",
    });
    expect(v.direction).toBe("flat");
    expect(v.standing).toBe("in-line");
    expect(v.sentence).toBe("In line with the 416 average.");
  });

  it("reads a one-bed against the GTA average as worse, not just lower", () => {
    // The brief's central fact: one-bed units fell 26.9% while the GTA fell 2.1%.
    const v = compare({
      value: -0.269,
      baseline: -0.021,
      baselineLabel: "the GTA average",
      polarity: "higher-is-better",
      unit: "ratio",
    });
    expect(v.direction).toBe("down");
    expect(v.standing).toBe("worse");
    expect(v.sentence).toBe("24.8% points below the GTA average.");
  });

  it("flips standing with polarity, so lower is not always bad news", () => {
    const faster = compare({
      value: 20,
      baseline: 35,
      baselineLabel: "the GTA median",
      polarity: "lower-is-better",
    });
    expect(faster.standing).toBe("better");

    const slower = compare({
      value: 60,
      baseline: 35,
      baselineLabel: "the GTA median",
      polarity: "lower-is-better",
    });
    expect(slower.standing).toBe("worse");
  });

  it("stays neutral when neither direction is good news", () => {
    const v = compare({
      value: 700_000,
      baseline: 651_648,
      baselineLabel: "the 416 average",
    });
    expect(v.direction).toBe("up");
    expect(v.standing).toBe("in-line");
  });

  it("does not divide by a zero baseline", () => {
    const v = compare({ value: 5, baseline: 0, baselineLabel: "nothing" });
    expect(v.ratio).toBe(0);
    expect(v.direction).toBe("flat");
  });
});

describe("verdictFor", () => {
  it("returns null when there is no baseline, rather than fabricating one", () => {
    expect(verdictFor({ label: "Average price", value: 651_648 })).toBeNull();
  });

  it("carries polarity and unit through to the verdict", () => {
    const v = verdictFor({
      label: "Days on market",
      value: 52,
      baseline: { label: "the GTA median", value: 35 },
      polarity: "lower-is-better",
    });
    expect(v?.standing).toBe("worse");
  });
});

describe("rankPhrase", () => {
  it("says top five percent, not ninety-fifth percentile", () => {
    expect(rankPhrase(0.95)).toBe("Top 5%");
    expect(rankPhrase(0.5)).toBe("Top 50%");
  });

  it("flips to bottom below the median", () => {
    expect(rankPhrase(0.12)).toBe("Bottom 12%");
  });

  it("never claims top zero percent", () => {
    expect(rankPhrase(1)).toBe("Top 1%");
    expect(rankPhrase(0)).toBe("Bottom 1%");
  });

  it("clamps rather than throwing on nonsense input", () => {
    expect(rankPhrase(1.4)).toBe("Top 1%");
    expect(rankPhrase(-2)).toBe("Bottom 1%");
  });
});

describe("polarity on the verdict", () => {
  it("is carried through so components do not colour a neutral comparison", () => {
    const v = compare({
      value: 651_648,
      baseline: 549_868,
      baselineLabel: "the 905 average",
    });
    expect(v.polarity).toBe("neutral");
    expect(v.standing).toBe("in-line");
  });

  it("is carried through for directional comparisons too", () => {
    const v = compare({
      value: 52,
      baseline: 35,
      baselineLabel: "the GTA median",
      polarity: "lower-is-better",
    });
    expect(v.polarity).toBe("lower-is-better");
  });
});
