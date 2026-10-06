import { sourced } from "@/lib/domain/provenance";

/**
 * The bracket a semi like hers sits in, before she gives us her address.
 *
 * A range and not a midpoint, because six sales is a bracket and pretending
 * otherwise is how a number gets treated as a promise. Her own address turns
 * it into her number, and that is the thing worth an account.
 */
const MOCK = {
  kind: "mock" as const,
  note: "Illustrative bracket for the prototype. The real one comes from the comps model.",
};

export const SEMI_BRACKET = {
  title: "A semi like yours, in Bendale",
  detail: "3 bed · 1,450 sq ft",
  low: sourced(938_000, MOCK),
  high: sourced(992_000, MOCK),
  confidence: "Fairly sure · a range, not one number",
  filled: 3,
  of: 5,
  body: "Six semis sold within 800 metres in the last year. This range is free to see. Your own address turns it into one number, and that needs an account.",
  inputs: [
    { label: "Your semi", value: "$—" },
    { label: "You owe", value: "$—" },
    { label: "Putting down", value: "$—" },
    { label: "Paying monthly", value: "$—" },
  ],
} as const;

/** The address the prototype fills in when she presses the button with the box empty. */
export const SAMPLE_ADDRESS = "41 Kelvin Avenue";

/**
 * What her address turns the bracket into: one number, and the four things
 * the number depends on, each of them hers to change. As invented as the
 * bracket above, and declared here so the block that shows them cannot
 * quietly widen them. The ceiling is what the four leave for the next house,
 * and it is the same figure her search arrived with, which is the point.
 */
export const SEMI_WORKED = {
  value: sourced(964_000, MOCK),
  confidence: "Sure enough · one number, from your address",
  filled: 4,
  of: 5,
  body: "Six semis within 800 metres in the last year, and the four things below. Change any of them and the number moves.",
  inputs: [
    { label: "Your semi", value: "$964,000" },
    { label: "You owe", value: "$412,000" },
    { label: "Putting down", value: "$520,000" },
    { label: "Paying monthly", value: "$3,900" },
  ],
  ceiling: 1_250_000,
} as const;
