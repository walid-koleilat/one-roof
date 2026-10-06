import { describe, expect, it } from "vitest";
import {
  formatCount,
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatDays,
  formatMonths,
  formatMonthYear,
  formatPercent,
  formatRange,
  spelledOut,
  formatSignedCurrency,
  formatSignedPercent,
  spelled,
} from "./format";

describe("currency", () => {
  it("writes exact dollars without cents", () => {
    expect(formatCurrency(651_648)).toBe("$651,648");
  });

  it("compacts to thousands and millions for scanning", () => {
    expect(formatCurrencyCompact(651_648)).toBe("$652k");
    expect(formatCurrencyCompact(1_250_000)).toBe("$1.25M");
    expect(formatCurrencyCompact(1_000_000)).toBe("$1M");
    expect(formatCurrencyCompact(840)).toBe("$840");
  });

  it("signs adjustments, because a comp adjustment is always signed", () => {
    expect(formatSignedCurrency(-18_000)).toBe("-$18,000");
    expect(formatSignedCurrency(4_500)).toBe("+$4,500");
    expect(formatSignedCurrency(0)).toBe("$0");
  });

  it("writes a range with a word, not a dash", () => {
    expect(formatRange(610_000, 665_000)).toBe("$610,000 to $665,000");
  });
});

describe("percentages", () => {
  it("drops the sign for a magnitude", () => {
    expect(formatPercent(-0.021)).toBe("2.1%");
    expect(formatPercent(0.97, 0)).toBe("97%");
  });

  it("keeps the sign where direction is the point", () => {
    expect(formatSignedPercent(-0.076)).toBe("-7.6%");
    expect(formatSignedPercent(0.021)).toBe("+2.1%");
  });

  it("leaves zero unsigned rather than claiming a direction", () => {
    expect(formatSignedPercent(0)).toBe("0.0%");
    expect(formatSignedPercent(0.0001)).toBe("0.0%");
  });
});

describe("dates and counts", () => {
  it("expands a month key", () => {
    expect(formatMonthYear("2026-08")).toBe("August 2026");
    expect(formatMonthYear("2026-08-14")).toBe("August 2026");
  });

  it("expands a full date", () => {
    expect(formatDate("2026-08-04")).toBe("August 4, 2026");
  });

  it("returns the input rather than inventing a date it cannot parse", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
    expect(formatMonthYear("2026-99")).toBe("2026-99");
  });

  it("pluralises", () => {
    expect(formatDays(35)).toBe("35 days");
    expect(formatDays(1)).toBe("1 day");
    expect(formatCount(23_141)).toBe("23,141");
    expect(formatMonths(5.6)).toBe("5.6 months");
  });
});

describe("spelled", () => {
  it("writes a small count as a word, so a sentence can open on it", () => {
    expect(spelled(11)).toBe("eleven");
    expect(spelled(3)).toBe("three");
  });

  it("falls back to digits past twelve, where the word stops helping", () => {
    expect(spelled(41)).toBe("41");
  });
});

describe("spelledOut, for a count that opens a sentence", () => {
  it("writes the design's own examples", () => {
    expect(spelledOut(19)).toBe("Nineteen");
    expect(spelledOut(31)).toBe("Thirty-one");
    expect(spelledOut(96)).toBe("Ninety-six");
    expect(spelledOut(245)).toBe("Two hundred and forty-five");
  });
  it("handles the round ones", () => {
    expect(spelledOut(0)).toBe("Zero");
    expect(spelledOut(10)).toBe("Ten");
    expect(spelledOut(40)).toBe("Forty");
    expect(spelledOut(100)).toBe("One hundred");
  });
  it("hands back the figure past what a sentence can carry", () => {
    expect(spelledOut(1000)).toBe("1000");
    expect(spelledOut(-1)).toBe("-1");
  });
});
