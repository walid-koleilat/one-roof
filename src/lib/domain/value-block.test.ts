import { describe, expect, it } from "vitest";
import {
  MAX_CONTRIBUTORS,
  ValueBlockError,
  valueBlock,
  wasTruncated,
} from "./value-block";

const base = {
  figure: "$610,000 to $665,000",
  label: "Estimated value",
  verdict: "Usable",
  comparison: "8% below the 416 average for a one-bed.",
  instruction: "Price at the low end if you have to close before March.",
};

describe("valueBlock", () => {
  it("builds a complete block", () => {
    const block = valueBlock(base);
    expect(block.instruction).toBe(base.instruction);
    expect(block.contributors).toEqual([]);
  });

  it("refuses a block with no instruction, loudly", () => {
    expect(() => valueBlock({ ...base, instruction: "   " })).toThrow(
      ValueBlockError,
    );
  });

  it("refuses a verdict that is a sentence rather than a word", () => {
    expect(() =>
      valueBlock({
        ...base,
        verdict: "This is broadly usable with caveats",
      }),
    ).toThrow(ValueBlockError);
  });

  it("allows a two-word verdict, because 'Not enough' is one idea", () => {
    expect(valueBlock({ ...base, verdict: "Not enough" }).verdict).toBe(
      "Not enough",
    );
  });

  it("truncates contributors to a ranking rather than a data dump", () => {
    const contributors = Array.from({ length: 7 }, (_, i) => ({
      label: `Factor ${i}`,
      detail: `${i}%`,
    }));
    const block = valueBlock({ ...base, contributors });
    expect(block.contributors).toHaveLength(MAX_CONTRIBUTORS);
    expect(block.contributors[0]?.label).toBe("Factor 0");
    expect(wasTruncated({ ...base, contributors })).toBe(true);
  });

  it("reports no truncation when the list fits", () => {
    expect(wasTruncated({ ...base, contributors: [] })).toBe(false);
  });

  it("accepts a null comparison when there is honestly nothing to compare to", () => {
    expect(valueBlock({ ...base, comparison: null }).comparison).toBeNull();
  });
});
