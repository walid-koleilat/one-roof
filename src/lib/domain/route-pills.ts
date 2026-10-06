import {
  CEILINGS,
  countFor,
  needOn,
  NEEDS,
  SEARCH,
  TOO_FEW,
  type Ceiling,
  type Need,
  type SearchState,
  type Shape,
} from "@/data/counts";
import { DECLARED } from "@/data/criteria";
import { formatCurrency, spelled, spelledOut } from "@/lib/domain/format";

/**
 * What each of the three shapes is worth to the search she is looking at.
 *
 * The three routes are not a partition, and the pill has to say so. Suite and
 * ground floor add up to the thirty-one that match; could-convert sits outside
 * that total on purpose, because a basement that might take a suite one day is
 * not a house with one. Rendered naively the row reads 19, 12, 26 beside a
 * total of 31 and looks like a product that cannot add up.
 *
 * So a pill that is on shows the homes it is currently contributing, and a
 * pill that is off shows what turning it on would add. Same number for
 * could-convert either way; different meaning, and the sign carries it.
 *
 * Both figures are asked of `countFor` rather than read out of the table it
 * uses, so they stay right when the budget or the area chip moves and the
 * table underneath is no longer the one in play.
 */

export interface RoutePill {
  shape: Shape;
  /** On when this shape is part of the search she is looking at. */
  active: boolean;
  /**
   * Homes contributed when active, homes it would add when not. Always
   * positive; `active` is what tells the reader which one they are looking at.
   */
  delta: number;
}

/** Widest first, matching the order the assistant described them in. */
export const SHAPE_ORDER: readonly Shape[] = ["suite", "ground", "convert"];

export function routePillsFor(state: SearchState): readonly RoutePill[] {
  const base = countFor(state);

  return SHAPE_ORDER.map((shape) => {
    const active = state.shapes.includes(shape);
    const other = state.shapes.filter((s) => s !== shape);
    const delta = active
      ? base - countFor({ ...state, shapes: other })
      : countFor({ ...state, shapes: [...other, shape] }) - base;

    return { shape, active, delta };
  });
}

/**
 * The total, or nothing while it is being worked out.
 *
 * A stale count she can read is worse than no count for the moment it takes to
 * recount, because she will act on the stale one. The caller renders the
 * absence rather than the old number.
 */
export function totalFor(state: SearchState, settled: boolean): number | null {
  return settled ? countFor(state) : null;
}

/**
 * The chips at the top of the filter panel, one per thing she said.
 *
 * Each carries the count of homes that match with that requirement on: the
 * total she is looking at when it is on, and what turning it on would leave
 * when it is off. Same rule as the route pills, and for the same reason: a
 * constraint is priced before it is applied, never after.
 *
 * What a chip controls is looked up by the id it was declared with, so the
 * label and the sentence she typed come from `criteria.ts` and nothing here
 * has to repeat them. Scarborough is the area she named, and there is no
 * toggle for it: pressing it still quotes her, but offers nothing to drop.
 */
export type ChipControl =
  | { kind: "shape"; shape: Shape }
  | { kind: "need"; need: Need }
  | { kind: "area" };

export interface CriterionChip {
  id: ChipId;
  label: string;
  /** Her words. The chip exists because of these. */
  said: string;
  control: ChipControl;
  on: boolean;
  /** Homes that match with this requirement on. */
  withOn: number;
  /** Homes that match with it off, or null where there is nothing to turn off. */
  withOff: number | null;
}

/** In the order she said them, which is also the order the design draws them in. */
export const CHIP_ORDER = [
  "second-kitchen",
  "hospital",
  "bus",
  "temple",
  "where",
] as const;

export type ChipId = (typeof CHIP_ORDER)[number];

const CHIP_CONTROL: Record<ChipId, ChipControl> = {
  "second-kitchen": { kind: "shape", shape: "suite" },
  hospital: { kind: "need", need: "nearHospital" },
  bus: { kind: "need", need: "nearTransit" },
  temple: { kind: "need", need: "nearTemple" },
  where: { kind: "area" },
};

export function criteriaChipsFor(state: SearchState): readonly CriterionChip[] {
  return CHIP_ORDER.map((id) => {
    // `criteria.test.ts` fails the build if an id in CHIP_ORDER is not declared.
    const declared = DECLARED.find((c) => c.id === id)!;
    const control = CHIP_CONTROL[id];
    const common = { id, label: declared.label, said: declared.said, control };

    switch (control.kind) {
      case "shape": {
        const on = state.shapes.includes(control.shape);
        const others = state.shapes.filter((s) => s !== control.shape);
        return {
          ...common,
          on,
          withOn: countFor({ ...state, shapes: [...others, control.shape] }),
          withOff: countFor({ ...state, shapes: others }),
        };
      }
      case "need":
        return {
          ...common,
          on: needOn(state, control.need),
          withOn: countFor({ ...state, [control.need]: true }),
          withOff: countFor({ ...state, [control.need]: false }),
        };
      case "area":
        return { ...common, on: true, withOn: countFor(state), withOff: null };
    }
  });
}

/**
 * The line under the "Drop it" button, saying what dropping would do.
 *
 * Usually it returns homes, because a requirement is something the count was
 * paying for. The second kitchen is the exception: it is one of the shapes
 * that add up to the total, so dropping it leaves fewer, and the line says
 * "leaves" rather than pretending. An off chip gets the mirror sentence.
 */
export function dropNote(chip: CriterionChip): string | null {
  if (chip.withOff === null) return null;
  const { on, withOn, withOff } = chip;
  if (on) {
    if (withOff > withOn) return `Dropping it returns ${withOff - withOn}`;
    if (withOff < withOn) return `Dropping it leaves ${withOff}`;
    return "Dropping it changes nothing";
  }
  if (withOn > withOff) return `Putting it back adds ${withOn - withOff}`;
  if (withOn < withOff) return `Putting it back leaves ${withOn}`;
  return "Putting it back changes nothing";
}

/**
 * "Thirty-one homes clear all four."
 *
 * The count is the one on the button, so it is withheld while that one is;
 * the "four" is how many chips are on, which is why it is never a literal.
 */
export function clearLine(
  count: number | null,
  chips: readonly CriterionChip[],
): string {
  const on = chips.filter((c) => c.on).length;
  const all = on === 1 ? "the one that is on" : `all ${spelled(on)}`;
  if (count === null) return `Counting how many clear ${all}.`;
  if (count === 1) return `One home clears ${all}.`;
  return `${spelledOut(count)} homes clear ${all}.`;
}

/**
 * The rows in "Nearby, as a requirement". Same booleans as the chips above
 * them, same count rule: what she has with it on.
 */
export interface NeedRow {
  need: Need;
  on: boolean;
  withOn: number;
}

export function needRowsFor(state: SearchState): readonly NeedRow[] {
  return NEEDS.map((need) => ({
    need,
    on: needOn(state, need),
    withOn: countFor({ ...state, [need]: true }),
  }));
}

/** What each requirement is, without the minutes. */
export const NEED_NAME: Record<Need, string> = {
  nearHospital: "Hospital",
  nearTransit: "A bus",
  nearTemple: "A temple",
  nearGrocery: "A grocery",
};

/** How the row reads, at the minutes she has it drawn to. */
export function needLabel(need: Need, minutes: Record<Need, number>): string {
  return `${NEED_NAME[need]} within ${minutes[need]} min`;
}

/** The short form, for "Drop the hospital". */
export const NEED_SHORT: Record<Need, string> = {
  nearHospital: "the hospital",
  nearTransit: "the bus",
  nearTemple: "the temple",
  nearGrocery: "the grocery",
};

/**
 * The requirement that is costing her the most homes right now.
 *
 * Only the four nearby requirements are candidates. The budget could restore
 * more, but it is her money rather than a radius, and the Price section
 * already offers to take the ceiling off in its own words.
 */
export interface Costliest {
  need: Need;
  /** What she has now. */
  count: number;
  /** What dropping it would bring back. */
  restored: number;
}

export function costliestFor(state: SearchState): Costliest | null {
  const count = countFor(state);
  let best: Costliest | null = null;
  for (const need of NEEDS) {
    if (!needOn(state, need)) continue;
    const restored = countFor({ ...state, [need]: false }) - count;
    if (restored > 0 && (best === null || restored > best.restored)) {
      best = { need, count, restored };
    }
  }
  return best;
}

/**
 * "Parking took you from thirty-one homes to two. Drop it and twenty-nine
 * come back."
 *
 * Rendered when the count is under `TOO_FEW`, and only if there is a
 * requirement whose removal would help. The panel never closes to deliver
 * bad news, and it names the constraint rather than saying "no results".
 */
export interface TooFew extends Costliest {
  sentence: string;
  button: string;
}

export function tooFewFor(state: SearchState, minutes: Record<Need, number>): TooFew | null {
  const costliest = costliestFor(state);
  if (costliest === null || costliest.count >= TOO_FEW) return null;
  const { need, count, restored } = costliest;
  const before = count + restored;
  return {
    ...costliest,
    sentence:
      `${needLabel(need, minutes)} took you from ${inSentence(before)} ` +
      `${before === 1 ? "home" : "homes"} to ${inSentence(count)}. ` +
      `Drop it and ${inSentence(restored)} ${restored === 1 ? "comes" : "come"} back.`,
    button: `Drop ${NEED_SHORT[need]}`,
  };
}

/** A count mid-sentence: words, lower case, and "none" rather than "zero". */
function inSentence(n: number): string {
  return n === 0 ? "none" : spelledOut(n).toLowerCase();
}

/**
 * How the three shapes read in the panel.
 *
 * Shorter than the cards on the arrival page, because here they sit in a
 * list she is scanning rather than a row she is choosing from. The words are
 * the board's, and they are the assistant's three shapes cut to a line each.
 */
export const SHAPE_ROWS: Record<Shape, { title: string; detail: string }> = {
  suite: {
    title: "A suite that is already there",
    detail: "Own kitchen, own door, and a record at the city.",
  },
  ground: {
    title: "A bedroom and bath on the ground floor",
    detail: "No second kitchen, but no stairs either.",
  },
  convert: {
    title: "A basement that could become one",
    detail: "Ceiling height and window size decide it, not how finished it looks.",
  },
};

/**
 * "The first two add up to the thirty-one that match. The third sits outside
 * that total on purpose, so it adds rather than filters."
 *
 * The thirty-one is the sum of the first two pills, never the button's count,
 * because the button includes could-convert when that is on and the sentence
 * is explaining why it does not belong there. Withheld while the button's
 * number is, for the same reason the button withholds it.
 */
export function fitLine(
  count: number | null,
  pills: readonly RoutePill[],
): string {
  const third =
    "The third sits outside that total on purpose, so it adds rather than filters.";
  if (count === null) {
    return `The first two add up to the homes that match. ${third}`;
  }
  const matching = pills
    .filter((p) => p.active && p.shape !== "convert")
    .reduce((n, p) => n + p.delta, 0);
  if (matching === 0) {
    return `The first two are off, so nothing matches yet. ${third}`;
  }
  return `The first two add up to the ${inSentence(matching)} that match. ${third}`;
}

/**
 * The price section, as five bars and the same five choices under them.
 *
 * One bar per ceiling the search bar already offers, plus one for none, each
 * at the count it would leave with everything else as it is. The bars are
 * the count table drawn rather than a second source, which is why they are
 * asked of `countFor` and not read from a chart file. There is no minimum:
 * nothing is modelled under the cheapest home on the page, and a control for
 * it would be a filter that filters nothing.
 */
export interface PriceBar {
  /** One of the declared ceilings, or null for none. */
  ceiling: Ceiling | null;
  /** "$1,050,000", or "No ceiling". */
  label: string;
  /** Homes that match with this ceiling and everything else as it is. */
  count: number;
  /** Height as a share of the tallest bar, 0 to 1. Never below the baseline. */
  share: number;
  /** The one she has now. Exactly one bar is. */
  selected: boolean;
}

export function priceBarsFor(state: SearchState): readonly PriceBar[] {
  const current: Ceiling | null = state.underBudget
    ? (state.ceiling ?? SEARCH.budget)
    : null;
  // The bars are the market under each ceiling, whatever minimum she has
  // set: a histogram that shrank as the minimum rose would be drawing her
  // selection twice and the market not at all.
  const { floor: _floor, ...market } = state;
  void _floor;
  const rows = [...CEILINGS, null].map((ceiling) => ({
    ceiling,
    label: ceiling === null ? "No ceiling" : formatCurrency(ceiling),
    count:
      ceiling === null
        ? countFor({ ...market, underBudget: false })
        : countFor({ ...market, underBudget: true, ceiling }),
    selected: ceiling === current,
  }));
  const tallest = Math.max(1, ...rows.map((r) => r.count));
  return rows.map((r) => ({ ...r, share: Math.max(0, r.count) / tallest }));
}

/**
 * Whether "Clear all" has anything to clear: a ceiling, or any nearby
 * requirement that is on.
 *
 * The shapes are not counted. They are the search rather than a filter on
 * it, the sticky bar owns them, and the page's Clear all leaves them alone.
 */
export function clearable(state: SearchState): boolean {
  return (
    state.underBudget ||
    state.floor !== undefined ||
    NEEDS.some((need) => needOn(state, need)) ||
    (state.minBeds ?? 1) > 1 ||
    (state.minBaths ?? 1) > 1
  );
}
