import type { SearchState, Shape } from "./counts";
import { HER_WORDS } from "./criteria";

/**
 * What the chat pill opens: her situation in five sentences, each with the
 * part she can change underlined.
 *
 * These are the assistant's summary of what she typed, not her words
 * verbatim, and every underlined clause carries the phrase of hers that put
 * it there. A test fails the build if one of those phrases stops being a
 * substring of anything she said. Without that, "from your chat" is a label a
 * lead form could wear.
 *
 * Changing a clause is changing the search. Each option is a patch on the
 * search state the counts are computed from, so the number beside an option
 * is the number she would get - the count moves before she chooses, not
 * after. The two clauses that do not move the count (the agent's language,
 * the semi) say so by showing the same number on every option.
 */

export const CONTEXT_DATE = "8 September";

/** A change to the search, in the terms the count table understands. */
export interface SearchPatch {
  shapes?: readonly Shape[];
  inBendale?: boolean;
  nearHospital?: boolean;
  nearTransit?: boolean;
  underBudget?: boolean;
  /** Whether the agents lead with the language she asked for. Never moves the count. */
  tamilFirst?: boolean;
}

export interface ClauseOption {
  label: string;
  patch: SearchPatch;
}

export interface Clause {
  /** The underlined words. */
  text: string;
  /** The phrase she typed that put this clause here. Must appear in HER_WORDS. */
  said: string;
  options: readonly ClauseOption[];
  /** Which option the current search corresponds to. */
  current: (state: SearchState, tamilFirst: boolean) => number;
}

export type SentencePart = string | Clause;

const has = (shapes: readonly Shape[], shape: Shape) => shapes.includes(shape);

export const SENTENCES: readonly (readonly SentencePart[])[] = [
  [
    "Five people, two households, ",
    {
      text: "in Scarborough and the east end",
      said: "in scarborough",
      options: [
        { label: "Bendale, near you", patch: { inBendale: true } },
        { label: "All of Scarborough", patch: { inBendale: false } },
      ],
      current: (s) => (s.inBendale ? 0 : 1),
    },
    ".",
  ],
  [
    "Appa fell in March, so the bedroom cannot be ",
    {
      text: "up a flight of stairs",
      said: "my appa fell in march",
      options: [
        {
          label: "Ground floor counts, with or without a kitchen",
          patch: { shapes: ["suite", "ground"] },
        },
        { label: "It has to be a suite", patch: { shapes: ["suite"] } },
      ],
      current: (s) => (has(s.shapes, "ground") ? 0 : 1),
    },
    ".",
  ],
  [
    "Amma cooks every day, so she needs ",
    {
      text: "a kitchen of her own",
      said: "does amma need her own kitchen",
      options: [
        { label: "A kitchen of her own", patch: { shapes: ["suite", "ground"] } },
        { label: "She can share ours", patch: { shapes: ["ground"] } },
      ],
      current: (s) => (has(s.shapes, "suite") ? 0 : 1),
    },
    ".",
  ],
  [
    "She does not drive, which puts ",
    {
      text: "transit and the hospital",
      said: "she doesn't drive",
      options: [
        {
          label: "Transit and the hospital",
          patch: { nearHospital: true, nearTransit: true },
        },
        {
          label: "Transit on its own",
          patch: { nearHospital: false, nearTransit: true },
        },
        {
          label: "Neither, she drives",
          patch: { nearHospital: false, nearTransit: false },
        },
      ],
      current: (s) =>
        s.nearHospital !== false && s.nearTransit !== false
          ? 0
          : s.nearTransit !== false
            ? 1
            : 2,
    },
    " on the map.",
  ],
  [
    "You want ",
    {
      text: "an agent who speaks Tamil",
      said: "a tamil agent would help",
      options: [
        { label: "Tamil first", patch: { tamilFirst: true } },
        { label: "Any agent, by record", patch: { tamilFirst: false } },
      ],
      current: (_s, tamilFirst) => (tamilFirst ? 0 : 1),
    },
    ", and you are ",
    {
      text: "selling a semi",
      said: "selling our semi",
      options: [
        {
          label: "Keep the ceiling until the semi is priced",
          patch: { underBudget: true },
        },
        { label: "No ceiling yet", patch: { underBudget: false } },
      ],
      current: (s) => (s.underBudget ? 0 : 1),
    },
    " first.",
  ],
];

/** The part of a patch the count table understands. The language is not in it. */
export function searchPart(patch: SearchPatch): Partial<SearchState> {
  const part: Partial<SearchState> = {};
  if (patch.shapes !== undefined) part.shapes = patch.shapes;
  if (patch.inBendale !== undefined) part.inBendale = patch.inBendale;
  if (patch.nearHospital !== undefined) part.nearHospital = patch.nearHospital;
  if (patch.nearTransit !== undefined) part.nearTransit = patch.nearTransit;
  if (patch.underBudget !== undefined) part.underBudget = patch.underBudget;
  return part;
}

/** Every clause, flat, for tests and for anything that needs to count them. */
export const CLAUSES: readonly Clause[] = SENTENCES.flatMap((s) =>
  s.filter((p): p is Clause => typeof p !== "string"),
);

/** True when the phrase behind a clause is something she actually typed. */
export function saidByHer(clause: Clause): boolean {
  const phrase = clause.said.toLowerCase();
  return HER_WORDS.some((w) => w.toLowerCase().includes(phrase));
}
