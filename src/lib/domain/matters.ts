import type { Agent } from "@/data/agents";
import type { Listing, Proof } from "@/data/listings";
import { suiteLabel } from "./listing";

/**
 * What a card says about a house, measured against what she actually asked for.
 *
 * The old card led with "4 bed · 3 bath · 2 kitchens", which is the listing's
 * summary of itself. It is true and it is useless: every home in the row says
 * something similar, so nothing in it lets her rule one out. This module turns
 * the same data into an answer to her own sentence - a second kitchen with its
 * own door, a short drive to the hospital, no stairs after a fall - so a number
 * on the card reads as a reply rather than as trivia.
 *
 * Three items, never four. A list long enough to skim past is a list nobody
 * reads, and the fourth thing was always the one that mattered least.
 */

export type MatterTone = "met" | "unmet" | "neutral";

export interface Matter {
  /** The claim, in her words rather than the feed's. */
  label: string;
  tone: MatterTone;
  /** The measured figure, where there is one. "8 min". */
  value?: string;
  /**
   * The number she set, beside the one we measured. "your 15".
   *
   * It is a separate field rather than part of the label because it is a
   * different kind of fact: the label and the value are the house, this is
   * her. It renders smaller and quieter for the same reason, and it is absent
   * on any row she did not set a threshold for.
   */
  against?: string;
  /** A photograph that shows the claim, opened from the label, and where it came from. */
  proof?: Proof;
}

/**
 * The thresholds she gave, in minutes.
 *
 * These are hers, not ours, which is why they are rendered on the card as
 * "Hospital under 15 min" on the criteria bar rather than as a badge on every
 * card. She can move them; we cannot.
 */
export interface Thresholds {
  hospitalMinutes: number;
  transitMinutes: number;
}

export const HER_THRESHOLDS: Thresholds = {
  hospitalMinutes: 15,
  transitMinutes: 10,
};

/**
 * The thing this house does not have, named plainly.
 *
 * A checklist that only ever shows ticks is marketing. She will find the
 * missing one standing in the basement anyway, and finding it there costs her
 * a Saturday.
 */
function shortfall(listing: Listing): Matter | null {
  switch (listing.suite) {
    case "ground-floor":
      return { label: "No second kitchen", tone: "unmet" };
    case "could-convert":
      return {
        label: "No kitchen down, and nothing on file at the city",
        tone: "unmet",
      };
    case "no-permit":
      return {
        label: "The city has no record of it",
        tone: "unmet",
      };
    case "legal-suite":
      return null;
  }
}

/** The claim the photograph is there to back up. */
function claim(listing: Listing): Matter {
  const label =
    listing.suite === "could-convert" ? listing.form : suiteLabel(listing.suite);
  return {
    label,
    tone: listing.suite === "no-permit" ? "unmet" : "met",
    proof: listing.proof,
  };
}

/** How far the hospital is, against the number she set. */
function hospital(listing: Listing, t: Thresholds): Matter {
  return {
    label: "Hospital",
    tone: listing.driveMinutes <= t.hospitalMinutes ? "met" : "unmet",
    value: `${listing.driveMinutes} min`,
    against: `your ${t.hospitalMinutes}`,
  };
}

/**
 * Exactly three, in the order she would ask them.
 *
 * The claim she cannot check from the street comes first and carries its
 * photograph. The distance she can check comes second, with her own threshold
 * beside it. The third slot goes to whatever this house fails on, and only
 * falls back to how many steps stand at the door when it fails on nothing.
 */
export function mattersFor(
  listing: Listing,
  thresholds: Thresholds = HER_THRESHOLDS,
): readonly [Matter, Matter, Matter] {
  const third = shortfall(listing) ?? {
    label: listing.access,
    tone: "met" as const,
  };
  return [claim(listing), hospital(listing, thresholds), third];
}

/**
 * Two, for the card that sits beside the map.
 *
 * The results card is 196px tall against a photograph, and a third row makes
 * it 209 - so the design draws two and the choice of which two has to be a
 * rule rather than a truncation. The claim always leads, because it is the one
 * thing she cannot check from the street. The second slot goes to whatever
 * this house fails on, and only falls back to the drive when it fails on
 * nothing: a checklist that only ever ticks is marketing, and the row she
 * needs is the one that would have cost her a Saturday.
 *
 * She can still see all three. Opening the listing is the one navigation on
 * this page, and the full list is what it opens onto.
 */
export function resultMattersFor(
  listing: Listing,
  thresholds: Thresholds = HER_THRESHOLDS,
): readonly [Matter, Matter] {
  return [claim(listing), shortfall(listing) ?? hospital(listing, thresholds)];
}

/**
 * One line for the rail beside the map: "Hospital 8 min, under your 15".
 *
 * The full card puts the measurement and her number side by side and lets
 * the tick say which way it went. The rail has one 12px line and no second
 * column, so the comparison is written out instead: `under` when the row
 * cleared her line, `over` when it missed. A shortfall carries no number and
 * is already a sentence, so it passes through untouched.
 */
export function railLine(matter: Matter): string {
  if (!matter.value || !matter.against) return matter.label;
  const way = matter.tone === "unmet" ? "over" : "under";
  return `${matter.label} ${matter.value}, ${way} ${matter.against}`;
}

/**
 * The same list, for a person rather than a house.
 *
 * She is buying, her mother does not speak English, and the thing she is
 * buying has a second kitchen in it. So an agent is worth ranking on exactly
 * those: who they can talk to, how many suites they have actually closed, and
 * whose side they usually sit on. A star rating is none of those, which is why
 * it sits at the foot of the card rather than the head of it.
 *
 * The language row exists only because she asked for it. With nothing
 * declared there is no standard to fail, so the card shows the record plainly:
 * two rows, no ticks, no dashes, and no warm anywhere, because warm means one
 * thing on this product and nothing here missed a line nobody drew.
 */

/** Below this, an agent has not really done suites. */
const FEW_SUITES = 5;
/** Of ten deals, fewer than this on the buyer's side is worth her knowing. */
const MOSTLY_SELLERS = 5;

export interface DeclaredLanguage {
  /** The language she asked for, as she named it. "Tamil". */
  language: string;
}

export function agentMattersFor(
  agent: Agent,
  declared?: DeclaredLanguage,
): readonly Matter[] {
  const suites: Matter = {
    label: "Homes with a suite",
    tone: declared
      ? agent.suites >= FEW_SUITES
        ? "met"
        : "unmet"
      : "neutral",
    value: String(agent.suites),
  };
  const side: Matter = {
    label: "Acts for the buyer",
    tone: declared
      ? agent.buyerSideInTen >= MOSTLY_SELLERS
        ? "met"
        : "unmet"
      : "neutral",
    value: `${agent.buyerSideInTen} in 10`,
  };
  if (!declared) return [suites, side];
  const language: Matter = {
    label: "Your mother can ask her own questions",
    tone: agent.languages.includes(declared.language) ? "met" : "unmet",
  };
  // Fixed order on every card. The row that fails is not moved to the end,
  // because a reader comparing three cards reads down the same lane on each.
  return [language, suites, side];
}

/**
 * Who comes first.
 *
 * With a language declared, the ones who speak it lead, in the order the data
 * lists them. Without one, the order is the record: homes with a suite,
 * most first. Neither is a ranking we made up for her; both are a fact she
 * can check against the card.
 */
export function agentsInOrder(
  agents: readonly Agent[],
  declared?: DeclaredLanguage,
): readonly Agent[] {
  if (declared) {
    const speaks = agents.filter((a) => a.languages.includes(declared.language));
    const rest = agents.filter((a) => !speaks.includes(a));
    return [...speaks, ...rest];
  }
  return [...agents].sort((a, b) => b.suites - a.suites);
}
