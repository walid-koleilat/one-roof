/**
 * The "so what" layer.
 *
 * Airbnb does not say "500 reviews". It says "top 5% of hosts". The raw count
 * is the input; the standing is the output, and the standing is the only part
 * a reader can act on. This file turns figures into standings.
 *
 * It lives in the domain layer because deciding that -7.6% is "worse than the
 * market" rather than "moving with the market" is a claim about the world, not
 * a styling choice. Components render the verdict; they do not reach it.
 */

import { formatPercent, formatSignedPercent } from "./format";

export type Direction = "up" | "down" | "flat";

/** Whether a higher number is good news for this reader. Drives colour only. */
export type Polarity = "higher-is-better" | "lower-is-better" | "neutral";

/** Where the figure sits relative to what it is being measured against. */
export type Standing = "better" | "worse" | "in-line";

/** Inside this band of the baseline, a difference is noise, not a finding. */
export const IN_LINE_RATIO = 0.02;

export interface ComparisonInput {
  value: number;
  baseline: number;
  /** What the baseline is, in the reader's words. "the 416 average". */
  baselineLabel: string;
  polarity?: Polarity;
  /** How the two numbers are written. Percentages read differently to dollars. */
  unit?: "ratio" | "absolute";
}

export interface Verdict {
  direction: Direction;
  /** value - baseline, in the input's own units. */
  delta: number;
  /** Proportional gap against the baseline. Zero when the baseline is zero. */
  ratio: number;
  standing: Standing;
  /**
   * Carried through so components do not have to guess. A neutral comparison
   * must not be coloured: green on "19% above the 905 average" tells a seller
   * their unit did well, which is not what that sentence says.
   */
  polarity: Polarity;
  /** One sentence a reader can quote. This is the product. */
  sentence: string;
}

/**
 * Compares a figure to its baseline and says what that means.
 *
 * `unit: "ratio"` means both numbers are already proportions (-0.269 against
 * -0.021), so the gap is expressed in percentage points rather than as a
 * percentage of a percentage, which nobody has ever understood.
 */
export function compare({
  value,
  baseline,
  baselineLabel,
  polarity = "neutral",
  unit = "absolute",
}: ComparisonInput): Verdict {
  const delta = value - baseline;
  const ratio = baseline === 0 ? 0 : delta / Math.abs(baseline);
  const direction: Direction =
    Math.abs(ratio) <= IN_LINE_RATIO ? "flat" : delta > 0 ? "up" : "down";

  const standing: Standing =
    direction === "flat" || polarity === "neutral"
      ? "in-line"
      : (direction === "up") === (polarity === "higher-is-better")
        ? "better"
        : "worse";

  return { direction, delta, ratio, standing, polarity, sentence: sentenceFor() };

  function sentenceFor(): string {
    if (direction === "flat") return `In line with ${baselineLabel}.`;
    const gap =
      unit === "ratio"
        ? `${formatPercent(Math.abs(delta), 1)} points`
        : formatPercent(Math.abs(ratio), 0);
    const word = direction === "up" ? "above" : "below";
    return `${gap} ${word} ${baselineLabel}.`;
  }
}

/**
 * A figure and the thing that makes it mean something. Every number in this
 * product ships as a pair, because a number alone invites the reader to invent
 * their own baseline and they always invent a flattering one.
 */
export interface NumberPair {
  label: string;
  value: number;
  baseline?: { label: string; value: number };
  polarity?: Polarity;
  unit?: "ratio" | "absolute";
}

/** The verdict for a pair, or null when no baseline was supplied. */
export function verdictFor(pair: NumberPair): Verdict | null {
  if (!pair.baseline) return null;
  return compare({
    value: pair.value,
    baseline: pair.baseline.value,
    baselineLabel: pair.baseline.label,
    ...(pair.polarity !== undefined ? { polarity: pair.polarity } : {}),
    ...(pair.unit !== undefined ? { unit: pair.unit } : {}),
  });
}

/**
 * "Top 5%" instead of "95th percentile". The percentile is an input to a
 * sentence, never the sentence itself.
 *
 * @param percentile 0 to 1, where 1 is the top of the distribution.
 */
export function rankPhrase(percentile: number): string {
  const clamped = Math.min(1, Math.max(0, percentile));
  const fromTop = Math.round((1 - clamped) * 100);
  const fromBottom = Math.round(clamped * 100);
  if (fromTop <= 50) return `Top ${Math.max(fromTop, 1)}%`;
  return `Bottom ${Math.max(fromBottom, 1)}%`;
}

/** Signed percentage for display, so callers do not re-derive the sign. */
export function verdictFigure(v: Verdict, unit: "ratio" | "absolute"): string {
  return unit === "ratio"
    ? `${formatSignedPercent(v.delta, 1)} points`
    : formatSignedPercent(v.ratio, 1);
}
