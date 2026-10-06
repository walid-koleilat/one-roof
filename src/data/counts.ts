import { AREA_TOTAL, LISTINGS, type Listing } from "@/data/listings";

/**
 * Every number that appears in copy, written down once.
 *
 * Four screens each claim a count - eleven in the advert, thirty-one on the
 * arrival page and again on search, five saved - and each count is a narrower
 * slice of the one above it. Written into components those numbers drift
 * apart, and a reviewer who adds them up finds a product that cannot count.
 * Written here they nest, and `counts.test.ts` fails when they stop nesting.
 *
 * The distinction that matters: the totals below are the market, and the rows
 * in `listings.ts` are the sample we can actually show. Thirty-one homes match
 * her search; ten of them have a card in this prototype. Saying so is more
 * honest than inventing twenty-one more addresses, and the tests check the
 * sample never contradicts the total.
 */

export const BENDALE_HOMES = 64;

/**
 * The search she ends up with: Bendale, under $1.25m, two of the three shapes.
 *
 * `couldConvert` is deliberately outside the total. A house that could take a
 * suite one day is not a house with one, and folding it into "31 match" would
 * be the product agreeing with her hopes rather than with the city.
 */
export const SEARCH = {
  matches: 31,
  legalSuite: 19,
  groundFloor: 12,
  couldConvert: 26,
  budget: 1_250_000,
  where: "Bendale",
} as const;

/** What the arrival page shows before the wall, and what it holds back. */
export const ARRIVAL_SHOWN = 8;

/**
 * What she has saved by the time J4 opens, and what arrived since.
 *
 * Two numbers that used to be one. `fromBendale` is the slice the nest
 * follows: eight were shown before the wall and she kept five. `total` is
 * every home across all three searches, and it is not a nest step - Woburn
 * and Cedarbrae are different questions, not narrower slices of Bendale.
 * The page printed eleven while this file said five, and nothing caught it
 * because eleven lived nowhere a test could see. Now it lives here, and
 * `counts.test.ts` asserts it against the fixture.
 */
export const SAVED = {
  fromBendale: 5,
  total: 11,
  searches: 3,
  collections: 2,
  newSinceTuesday: 2,
  /**
   * Homes the agent has a seat on. Fewer than the total, and that is the
   * whole point: an agent on everything is an agent on the search, which is
   * the arrangement this page exists to replace. The prototype bar prints
   * it, so it lives here where a test can hold it to the fixture.
   */
  agentOn: 6,
} as const;

/** The widget's slice: a second kitchen the city has a record of. */
export const WITH_RECORD = 3;

/** And the one that has the kitchen but no record, named only in prose. */
export const NAMED_IN_PROSE = 1;

/**
 * The nest, in order, widest first.
 *
 * Each step must be no larger than the one before it. That is the only rule,
 * and it is the one that was being broken.
 */
export const NEST: readonly { label: string; count: number }[] = [
  { label: "homes in Bendale", count: BENDALE_HOMES },
  { label: "match her search", count: SEARCH.matches },
  { label: "in the area the advert drew", count: AREA_TOTAL },
  { label: "shown before the wall", count: ARRIVAL_SHOWN },
  { label: "she saved out of Bendale", count: SAVED.fromBendale },
  { label: "with a second kitchen on record", count: WITH_RECORD },
  { label: "named in prose", count: NAMED_IN_PROSE },
];

/** Homes priced inside the budget she set. */
export function withinBudget(listings: readonly Listing[]): readonly Listing[] {
  return listings.filter((l) => l.askingPrice.value <= SEARCH.budget);
}

/** The two shapes she actually searched for. A basement that might is not one. */
export function matchesSearch(
  listings: readonly Listing[],
): readonly Listing[] {
  return withinBudget(listings).filter(
    (l) => l.suite === "legal-suite" || l.suite === "ground-floor",
  );
}

/** The sample of the market that has a card in this prototype. */
export const SAMPLE = matchesSearch(LISTINGS);

/**
 * What the count does when she changes her mind.
 *
 * The arrival page's one interactive claim is that the chat handed over real
 * criteria: pull "Bendale" out of the chips and the number has to move, or the
 * chips are decoration. So the market is declared at three widths rather than
 * computed from a formula nobody can check, and `countFor` is the only thing
 * allowed to add them up.
 *
 * These are invented figures like every other number here. They are declared
 * rather than derived so that a reviewer can see exactly what changing a
 * criterion is claiming.
 */
export type Shape = "suite" | "ground" | "convert";

const IN_BENDALE: Record<Shape, number> = { suite: 19, ground: 12, convert: 26 };
const IN_SCARBOROUGH: Record<Shape, number> = {
  suite: 96,
  ground: 61,
  convert: 133,
};
/** What the budget was holding back, per shape. */
const ABOVE_BUDGET: Record<Shape, number> = { suite: 14, ground: 9, convert: 22 };

/**
 * The ceilings the search bar offers, and what moving hers costs.
 *
 * Her own ceiling is $1,250,000 and the tables above already assume it. The
 * other three are declared as deltas from it, per shape, so that the number
 * beside each choice in the bar is a real count rather than the same figure
 * four times. Invented like everything else here, and written down so a
 * reviewer can see exactly what "under $1,150,000" is claiming.
 */
export const CEILINGS = [1_050_000, 1_150_000, 1_250_000, 1_350_000] as const;
export type Ceiling = (typeof CEILINGS)[number];
const CEILING_DELTA: Record<Ceiling, Record<Shape, number>> = {
  1_050_000: { suite: -8, ground: -5, convert: -11 },
  1_150_000: { suite: -4, ground: -3, convert: -6 },
  1_250_000: { suite: 0, ground: 0, convert: 0 },
  1_350_000: { suite: 5, ground: 3, convert: 7 },
};

/**
 * The four things nearby that can be made a requirement.
 *
 * The map draws all four; the filter panel lets each one narrow the list.
 * Two of them she said in the chat and two she did not, and the difference
 * is only in what the tables below already assume.
 */
export type Need = "nearHospital" | "nearTransit" | "nearTemple" | "nearGrocery";

/** In the order the panel lists them, which is the order she said them in. */
export const NEEDS: readonly Need[] = [
  "nearHospital",
  "nearTransit",
  "nearTemple",
  "nearGrocery",
];

export interface SearchState {
  shapes: readonly Shape[];
  /** False once she removes the Bendale chip. */
  inBendale: boolean;
  /** False once she removes the budget chip. */
  underBudget: boolean;
  /** Which ceiling, when there is one. Hers when unset. */
  ceiling?: Ceiling;
  /**
   * A minimum, as one of the declared stops: homes at or under it are out.
   * The count is then the count under the ceiling less the count under
   * this, both rows the table already has, so a minimum costs no invented
   * data. Unset is no minimum.
   */
  floor?: Ceiling;
  /**
   * Her two travel requirements, which she declared in the chat and can drop.
   *
   * Declared as deltas rather than computed from the sample for the same
   * reason the shapes are: ten cards cannot stand in for a market of 157, and
   * a reviewer should be able to see exactly what dropping one is claiming.
   */
  nearHospital?: boolean;
  nearTransit?: boolean;
  /**
   * The two she can add. The temple she mentioned softly ("if we can") and
   * the grocery she did not mention at all, so neither is on until she says
   * so here. Left out, each reads as whatever `TABLE_ASSUMES` says.
   */
  nearTemple?: boolean;
  nearGrocery?: boolean;
  /** How far each requirement reaches, where she has moved it off the base stop. */
  minutes?: Partial<Record<Need, Minutes>>;
  /** At least this many. Unset or one is any. */
  minBeds?: Beds;
  minBaths?: Baths;
}

export const DEFAULT_SEARCH: SearchState = {
  shapes: ["suite", "ground"],
  inBendale: true,
  underBudget: true,
  nearHospital: true,
  nearTransit: true,
  nearTemple: false,
  nearGrocery: false,
};

/**
 * What the count tables above already have baked in.
 *
 * The thirty-one is the market with the hospital and the bus already taken
 * out and the temple and the grocery left in. So a requirement only moves the
 * count when it differs from this row: turning the hospital off gives its
 * cost back, turning the temple on takes its cost away.
 */
export const TABLE_ASSUMES: Record<Need, boolean> = {
  nearHospital: true,
  nearTransit: true,
  nearTemple: false,
  nearGrocery: false,
};

/** Whether a requirement is on, reading an unset one as the table does. */
export function needOn(state: SearchState, need: Need): boolean {
  return state[need] ?? TABLE_ASSUMES[need];
}

/**
 * What each requirement is worth, per shape.
 *
 * For the two she declared this is what dropping one returns; for the two she
 * did not, it is what requiring one costs. Invented figures like the rest of
 * the file, and declared rather than derived so a reviewer can see exactly
 * what each toggle is claiming. The temple and grocery rows are set so that,
 * on the search she arrives with, requiring a temple leaves twelve of the
 * thirty-one and requiring a grocery leaves nineteen, which are the numbers
 * the design drew; `counts.test.ts` holds them there.
 */
/**
 * How far is near, as the five stops the steppers offer.
 *
 * A requirement costs more the tighter it is drawn, and the cost is declared
 * at every stop rather than scaled from one, so a reviewer can read what
 * "a hospital within five minutes" is claiming as plainly as "within
 * fifteen". Her own fifteen and ten are the base stops for the two she
 * declared; the product's ten is the base for the two she did not.
 */
export const MINUTE_STOPS = [5, 10, 15, 20, 30] as const;
export type Minutes = (typeof MINUTE_STOPS)[number];

export const BASE_MINUTES: Record<Need, Minutes> = {
  nearHospital: 15,
  nearTransit: 10,
  nearTemple: 10,
  nearGrocery: 10,
};

type CostByMinutes = Record<Minutes, Record<Shape, number>>;
const HOSPITAL_COST_AT: CostByMinutes = {
  5: { suite: 14, ground: 9, convert: 19 },
  10: { suite: 9, ground: 6, convert: 12 },
  15: { suite: 5, ground: 3, convert: 7 },
  20: { suite: 3, ground: 2, convert: 4 },
  30: { suite: 1, ground: 1, convert: 2 },
};
const TRANSIT_COST_AT: CostByMinutes = {
  5: { suite: 7, ground: 5, convert: 10 },
  10: { suite: 3, ground: 2, convert: 5 },
  15: { suite: 2, ground: 1, convert: 3 },
  20: { suite: 1, ground: 1, convert: 1 },
  30: { suite: 0, ground: 0, convert: 0 },
};
const TEMPLE_COST_AT: CostByMinutes = {
  5: { suite: 16, ground: 9, convert: 21 },
  10: { suite: 12, ground: 7, convert: 16 },
  15: { suite: 8, ground: 5, convert: 11 },
  20: { suite: 5, ground: 3, convert: 7 },
  30: { suite: 2, ground: 1, convert: 3 },
};
const GROCERY_COST_AT: CostByMinutes = {
  5: { suite: 11, ground: 7, convert: 15 },
  10: { suite: 7, ground: 5, convert: 10 },
  15: { suite: 4, ground: 3, convert: 6 },
  20: { suite: 2, ground: 1, convert: 3 },
  30: { suite: 1, ground: 0, convert: 1 },
};

export const NEED_COST_AT: Record<Need, CostByMinutes> = {
  nearHospital: HOSPITAL_COST_AT,
  nearTransit: TRANSIT_COST_AT,
  nearTemple: TEMPLE_COST_AT,
  nearGrocery: GROCERY_COST_AT,
};

/** The cost at the base stop, which is what the tables above already assume. */
export const NEED_COST: Record<Need, Record<Shape, number>> = {
  nearHospital: HOSPITAL_COST_AT[BASE_MINUTES.nearHospital],
  nearTransit: TRANSIT_COST_AT[BASE_MINUTES.nearTransit],
  nearTemple: TEMPLE_COST_AT[BASE_MINUTES.nearTemple],
  nearGrocery: GROCERY_COST_AT[BASE_MINUTES.nearGrocery],
};

/**
 * Bedrooms and bathrooms, as "at least" thresholds.
 *
 * One is "any", and costs nothing; every step up is declared per shape, the
 * way the places are, so the button's number is a claim a reviewer can read
 * off this table. The sample cards filter on their own room counts, which is
 * why `listingsFor` looks at `metrics` for these and at nothing else.
 */
export const BED_STOPS = [1, 2, 3, 4, 5] as const;
export const BATH_STOPS = [1, 2, 3, 4] as const;
export type Beds = (typeof BED_STOPS)[number];
export type Baths = (typeof BATH_STOPS)[number];

/**
 * What the conversation's arithmetic came to: a bedroom and a full bath
 * for her parents, three bedrooms and a bath of your own. The search she
 * arrives with starts here, and the tables below take it as read: every
 * home with a suite in them already has four bedrooms and two bathrooms,
 * so asking for that costs nothing, and only a fifth bedroom or a third
 * bathroom narrows the count.
 */
export const CHAT_ROOMS = { beds: 4, baths: 2 } as const satisfies {
  beds: Beds;
  baths: Baths;
};

const BEDS_COST_AT: Record<Beds, Record<Shape, number>> = {
  1: { suite: 0, ground: 0, convert: 0 },
  2: { suite: 0, ground: 0, convert: 0 },
  3: { suite: 0, ground: 0, convert: 0 },
  4: { suite: 0, ground: 0, convert: 0 },
  5: { suite: 15, ground: 9, convert: 20 },
};
const BATHS_COST_AT: Record<Baths, Record<Shape, number>> = {
  1: { suite: 0, ground: 0, convert: 0 },
  2: { suite: 0, ground: 0, convert: 0 },
  3: { suite: 10, ground: 6, convert: 13 },
  4: { suite: 16, ground: 10, convert: 21 },
};

export const ROOM_COST_AT = { beds: BEDS_COST_AT, baths: BATHS_COST_AT } as const;

/** How far she has drawn a requirement, reading an unset one as the base. */
export function minutesFor(state: SearchState, need: Need): Minutes {
  return state.minutes?.[need] ?? BASE_MINUTES[need];
}

/**
 * How far is near, for the two she never put a number on.
 *
 * Her own fifteen and ten minutes live in `matters.ts` because they are hers.
 * These two are the product's, and they are ten because the map already
 * draws a ten-minute walk for both layers.
 */
export const NEARBY_MINUTES = { temple: 10, grocery: 10 } as const;

/**
 * Under this many homes the panel stops counting and starts talking: it
 * names the requirement that cost the most and offers to drop it, rather than
 * letting her arrive at "no results".
 */
export const TOO_FEW = 5;

export function countFor(state: SearchState): number {
  if (state.floor !== undefined) {
    const { floor, ...rest } = state;
    const under = countFor({ ...rest, underBudget: true, ceiling: floor });
    return Math.max(0, countFor(rest) - under);
  }
  const table = state.inBendale ? IN_BENDALE : IN_SCARBOROUGH;
  const scale = state.inBendale ? 1 : 5;
  // Declared costs add up, and two requirements at a low ceiling can add up
  // to more than the market. Zero homes is the honest floor; a negative
  // count is a table artefact, not a claim.
  return Math.max(0, state.shapes.reduce((total, shape) => {
    const ceiling =
      state.underBudget && state.ceiling !== undefined
        ? CEILING_DELTA[state.ceiling][shape] * scale
        : 0;
    const base =
      table[shape] + (state.underBudget ? ceiling : ABOVE_BUDGET[shape]);
    // What the table already took out for a requirement, against what she
    // wants taken out now. Off gives the whole baked cost back; on at a
    // tighter stop takes more; on at the base stop is what the table says.
    const moved = NEEDS.reduce((sum, need) => {
      const baked = TABLE_ASSUMES[need]
        ? NEED_COST_AT[need][BASE_MINUTES[need]][shape]
        : 0;
      const wanted = needOn(state, need)
        ? NEED_COST_AT[need][minutesFor(state, need)][shape]
        : 0;
      return sum + (baked - wanted) * scale;
    }, 0);
    const rooms =
      (BEDS_COST_AT[state.minBeds ?? 1][shape] +
        BATHS_COST_AT[state.minBaths ?? 1][shape]) *
      scale;
    return total + base + moved - rooms;
  }, 0));
}

/** The homes we can actually put a card in front of, for a given state. */
export function listingsFor(
  state: SearchState,
  listings: readonly Listing[],
): readonly Listing[] {
  const wanted = new Set<string>(
    state.shapes.map((s) =>
      s === "suite" ? "legal-suite" : s === "ground" ? "ground-floor" : "could-convert",
    ),
  );
  return listings.filter(
    (l) =>
      wanted.has(l.suite) &&
      (!state.underBudget ||
        l.askingPrice.value <= (state.ceiling ?? SEARCH.budget)) &&
      (state.floor === undefined || l.askingPrice.value > state.floor) &&
      l.metrics.beds >= (state.minBeds ?? 1) &&
      l.metrics.baths >= (state.minBaths ?? 1),
  );
}

/** The cheapest home of each shape, for the "From $..." line on the shape cards. */
export const SHAPE_FLOOR: Record<Shape, number> = {
  suite: 1_189_000,
  ground: 1_045_000,
  convert: 1_120_000,
};

export const SHAPE_TOTAL: Record<Shape, number> = IN_BENDALE;
