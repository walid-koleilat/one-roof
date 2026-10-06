/**
 * Every number in this prototype carries where it came from.
 *
 * Two constraints from the build brief force this to be a type rather than a
 * convention:
 *   - "Confidence is shown, not hidden. A valuation claiming more certainty
 *     than it has is worse than none."
 *   - The size-cohort series is "derived from chart geometry - label as derived."
 *
 * If provenance is a required field, a component physically cannot render a
 * number without having decided how to disclose it.
 */
export type Provenance =
  /** Published by a named body (TRREB, CMHC, StatCan) and quotable as-is. */
  | { kind: "published"; source: string; asOf: string; url?: string }
  /** Read off a published chart rather than a published table. Weaker. */
  | { kind: "derived"; source: string; asOf: string; method: string }
  /** Computed by us from other facts in this file. */
  | { kind: "computed"; from: string[] }
  /** Invented for the prototype. Must never be presented as real. */
  | { kind: "mock"; note: string };

export interface Sourced<T> {
  value: T;
  provenance: Provenance;
}

export const sourced = <T,>(value: T, provenance: Provenance): Sourced<T> => ({
  value,
  provenance,
});

/** True when a figure is weak enough that the UI owes the reader a caveat. */
export function needsCaveat(p: Provenance): boolean {
  return p.kind === "derived" || p.kind === "mock";
}

/** Short human label for a provenance chip. */
export function provenanceLabel(p: Provenance): string {
  switch (p.kind) {
    case "published":
      return `${p.source}, ${p.asOf}`;
    case "derived":
      return `Derived from ${p.source}, ${p.asOf}`;
    case "computed":
      return `Computed from ${p.from.join(" + ")}`;
    case "mock":
      return "Illustrative only";
  }
}
