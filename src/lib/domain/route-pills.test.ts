import { describe, expect, it } from "vitest";
import {
  CEILINGS,
  countFor,
  DEFAULT_SEARCH,
  NEEDS,
  SEARCH,
  TOO_FEW,
  type SearchState,
} from "@/data/counts";
import { DECLARED } from "@/data/criteria";
import { BASE_MINUTES } from "@/data/counts";
import {
  CHIP_ORDER,
  clearable,
  clearLine,
  costliestFor,
  criteriaChipsFor,
  dropNote,
  fitLine,
  needLabel,
  needRowsFor,
  priceBarsFor,
  routePillsFor,
  SHAPE_ORDER,
  SHAPE_ROWS,
  tooFewFor,
  totalFor,
} from "./route-pills";

/**
 * The pill row is the place the three-routes-are-not-a-partition rule either
 * holds or visibly breaks, so it is a test rather than a comment.
 */

function pill(state: SearchState, shape: (typeof SHAPE_ORDER)[number]) {
  return routePillsFor(state).find((p) => p.shape === shape)!;
}

describe("routePillsFor", () => {
  it("returns one pill per shape, widest first", () => {
    expect(routePillsFor(DEFAULT_SEARCH).map((p) => p.shape)).toEqual([
      "suite",
      "ground",
      "convert",
    ]);
  });

  it("shows an active shape the homes it is contributing", () => {
    expect(pill(DEFAULT_SEARCH, "suite").delta).toBe(SEARCH.legalSuite);
    expect(pill(DEFAULT_SEARCH, "ground").delta).toBe(SEARCH.groundFloor);
  });

  it("shows an inactive shape what it would add, not what it would filter to", () => {
    const convert = pill(DEFAULT_SEARCH, "convert");
    expect(convert.active).toBe(false);
    expect(convert.delta).toBe(SEARCH.couldConvert);
  });

  it("adds could-convert to the total rather than replacing it", () => {
    // The whole reason the pill carries a plus. Pressing it widens the search.
    const widened = { ...DEFAULT_SEARCH, shapes: ["suite", "ground", "convert"] as const };
    expect(countFor(widened)).toBe(
      SEARCH.matches + SEARCH.couldConvert,
    );
  });

  it("has the active deltas sum to the total she is shown", () => {
    const pills = routePillsFor(DEFAULT_SEARCH);
    const contributed = pills
      .filter((p) => p.active)
      .reduce((n, p) => n + p.delta, 0);
    expect(contributed).toBe(countFor(DEFAULT_SEARCH));
  });

  it("keeps that true for every combination of shapes", () => {
    const combinations: readonly SearchState["shapes"][] = [
      [],
      ["suite"],
      ["ground"],
      ["convert"],
      ["suite", "ground"],
      ["suite", "convert"],
      ["ground", "convert"],
      ["suite", "ground", "convert"],
    ];

    for (const shapes of combinations) {
      const state: SearchState = { ...DEFAULT_SEARCH, shapes };
      const contributed = routePillsFor(state)
        .filter((p) => p.active)
        .reduce((n, p) => n + p.delta, 0);
      expect(contributed, `shapes: ${shapes.join(", ") || "none"}`).toBe(
        countFor(state),
      );
    }
  });

  it("never renders a negative number on a pill", () => {
    for (const inBendale of [true, false]) {
      for (const underBudget of [true, false]) {
        const state: SearchState = { ...DEFAULT_SEARCH, inBendale, underBudget };
        for (const p of routePillsFor(state)) {
          expect(p.delta, `${p.shape} in ${String(inBendale)}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("grows every pill when the budget chip comes off", () => {
    const capped = routePillsFor(DEFAULT_SEARCH);
    const uncapped = routePillsFor({ ...DEFAULT_SEARCH, underBudget: false });

    for (const [i, pillNow] of uncapped.entries()) {
      expect(pillNow.delta).toBeGreaterThan(capped[i]!.delta);
    }
  });
});

describe("totalFor", () => {
  it("gives the count once it has settled", () => {
    expect(totalFor(DEFAULT_SEARCH, true)).toBe(SEARCH.matches);
  });

  it("withholds it rather than handing back a stale one", () => {
    expect(totalFor(DEFAULT_SEARCH, false)).toBeNull();
  });
});

/**
 * The chips at the top of the filter panel claim to be what she said. That
 * claim is checked in `criteria.test.ts`; what is checked here is that each
 * one is priced honestly and that the mapping to the search is total.
 */
describe("criteriaChipsFor", () => {
  const chips = criteriaChipsFor(DEFAULT_SEARCH);

  it("renders the five she said, in the order she said them", () => {
    expect(chips.map((c) => c.id)).toEqual([...CHIP_ORDER]);
  });

  it("carries her words and her label from the declaration, not a copy", () => {
    for (const chip of chips) {
      const declared = DECLARED.find((c) => c.id === chip.id)!;
      expect(chip.label).toBe(declared.label);
      expect(chip.said).toBe(declared.said);
    }
  });

  it("prices an on chip at the total she is looking at", () => {
    for (const chip of chips.filter((c) => c.on)) {
      expect(chip.withOn, chip.id).toBe(countFor(DEFAULT_SEARCH));
    }
  });

  it("prices an off chip at what turning it on would leave", () => {
    const temple = chips.find((c) => c.id === "temple")!;
    expect(temple.on).toBe(false);
    expect(temple.withOn).toBe(countFor({ ...DEFAULT_SEARCH, nearTemple: true }));
    expect(temple.withOff).toBe(countFor(DEFAULT_SEARCH));
  });

  it("gives Scarborough nothing to drop", () => {
    const where = chips.find((c) => c.id === "where")!;
    expect(where.on).toBe(true);
    expect(where.withOff).toBeNull();
    expect(dropNote(where)).toBeNull();
  });

  it("follows the second kitchen to the suite shape", () => {
    const kitchen = chips.find((c) => c.id === "second-kitchen")!;
    expect(kitchen.control).toEqual({ kind: "shape", shape: "suite" });
    expect(kitchen.on).toBe(true);
    expect(kitchen.withOff).toBe(SEARCH.groundFloor);
    const without = criteriaChipsFor({ ...DEFAULT_SEARCH, shapes: ["ground"] });
    expect(without.find((c) => c.id === "second-kitchen")!.on).toBe(false);
  });

  it("shares its booleans with the nearby rows", () => {
    const state = { ...DEFAULT_SEARCH, nearHospital: false, nearTemple: true };
    const hospital = criteriaChipsFor(state).find((c) => c.id === "hospital")!;
    const temple = criteriaChipsFor(state).find((c) => c.id === "temple")!;
    const rows = needRowsFor(state);
    expect(hospital.on).toBe(rows.find((r) => r.need === "nearHospital")!.on);
    expect(temple.on).toBe(rows.find((r) => r.need === "nearTemple")!.on);
  });
});

describe("dropNote", () => {
  const chips = criteriaChipsFor(DEFAULT_SEARCH);

  it("says what dropping a requirement returns", () => {
    const hospital = chips.find((c) => c.id === "hospital")!;
    expect(dropNote(hospital)).toBe("Dropping it returns 8");
  });

  it("says what dropping the kitchen leaves, because it narrows rather than widens", () => {
    const kitchen = chips.find((c) => c.id === "second-kitchen")!;
    expect(dropNote(kitchen)).toBe(`Dropping it leaves ${SEARCH.groundFloor}`);
  });

  it("mirrors the sentence for a chip that is off", () => {
    const temple = chips.find((c) => c.id === "temple")!;
    expect(dropNote(temple)).toBe("Putting it back leaves 12");
    const off = criteriaChipsFor({ ...DEFAULT_SEARCH, nearHospital: false });
    expect(dropNote(off.find((c) => c.id === "hospital")!)).toBe("Putting it back leaves 31");
  });
});

describe("clearLine", () => {
  it("spells the count and says how many chips are on", () => {
    expect(clearLine(31, criteriaChipsFor(DEFAULT_SEARCH))).toBe(
      "Thirty-one homes clear all four.",
    );
  });

  it("recounts the chips when one goes off", () => {
    const state = { ...DEFAULT_SEARCH, nearHospital: false };
    expect(clearLine(countFor(state), criteriaChipsFor(state))).toBe(
      "Thirty-nine homes clear all three.",
    );
  });

  it("withholds the number while it is being worked out", () => {
    expect(clearLine(null, criteriaChipsFor(DEFAULT_SEARCH))).toBe(
      "Counting how many clear all four.",
    );
  });

  it("does not write 'one homes'", () => {
    expect(clearLine(1, criteriaChipsFor(DEFAULT_SEARCH))).toMatch(/^One home clears/);
  });
});

describe("needRowsFor", () => {
  it("lists the four, in the order the panel draws them", () => {
    expect(needRowsFor(DEFAULT_SEARCH).map((r) => r.need)).toEqual([...NEEDS]);
  });

  it("shows the design's numbers on the search she arrives with", () => {
    const by = Object.fromEntries(needRowsFor(DEFAULT_SEARCH).map((r) => [r.need, r]));
    expect(by.nearHospital).toMatchObject({ on: true, withOn: 31 });
    expect(by.nearTransit).toMatchObject({ on: true, withOn: 31 });
    expect(by.nearTemple).toMatchObject({ on: false, withOn: 12 });
    expect(by.nearGrocery).toMatchObject({ on: false, withOn: 19 });
  });

  it("labels the rows with her minutes where she gave them", () => {
    expect(needLabel("nearHospital", BASE_MINUTES)).toBe("Hospital within 15 min");
    expect(needLabel("nearTransit", BASE_MINUTES)).toBe("A bus within 10 min");
    expect(needLabel("nearTemple", BASE_MINUTES)).toBe("A temple within 10 min");
    expect(needLabel("nearGrocery", BASE_MINUTES)).toBe("A grocery within 10 min");
  });
});

describe("costliestFor", () => {
  it("names the requirement whose removal restores the most", () => {
    const state = { ...DEFAULT_SEARCH, nearTemple: true, nearGrocery: true };
    expect(costliestFor(state)).toEqual({ need: "nearTemple", count: 0, restored: 19 });
  });

  it("only considers requirements that are on", () => {
    expect(costliestFor(DEFAULT_SEARCH)).toEqual({
      need: "nearHospital",
      count: 31,
      restored: 8,
    });
    const none = { ...DEFAULT_SEARCH, nearHospital: false, nearTransit: false };
    expect(costliestFor(none)).toBeNull();
  });

  it("has nothing to offer when no shape is on", () => {
    expect(costliestFor({ ...DEFAULT_SEARCH, shapes: [] })).toBeNull();
  });
});

describe("tooFewFor", () => {
  it("stays quiet while there are enough homes", () => {
    expect(countFor(DEFAULT_SEARCH)).toBeGreaterThanOrEqual(TOO_FEW);
    expect(tooFewFor(DEFAULT_SEARCH, BASE_MINUTES)).toBeNull();
  });

  it("names the constraint and prices the way back", () => {
    const state = { ...DEFAULT_SEARCH, nearTemple: true, nearGrocery: true };
    expect(tooFewFor(state, BASE_MINUTES)).toEqual({
      need: "nearTemple",
      count: 0,
      restored: 19,
      sentence:
        "A temple within 10 min took you from nineteen homes to none. Drop it and nineteen come back.",
      button: "Drop the temple",
    });
  });

  it("recounts for the shape she has left, in words", () => {
    // Ground floor alone is twelve; a temple takes seven and a grocery five.
    const state: SearchState = {
      ...DEFAULT_SEARCH,
      shapes: ["ground"],
      nearTemple: true,
      nearGrocery: true,
    };
    expect(tooFewFor(state, BASE_MINUTES)!.sentence).toBe(
      "A temple within 10 min took you from seven homes to none. Drop it and seven come back.",
    );
  });

  it("stays quiet at exactly the line", () => {
    // Ground floor alone with a temple is five, and five is not too few.
    const state: SearchState = { ...DEFAULT_SEARCH, shapes: ["ground"], nearTemple: true };
    expect(countFor(state)).toBe(TOO_FEW);
    expect(tooFewFor(state, BASE_MINUTES)).toBeNull();
  });

  it("says nothing when nothing can be dropped, even at zero", () => {
    expect(tooFewFor({ ...DEFAULT_SEARCH, shapes: [] }, BASE_MINUTES)).toBeNull();
  });
});

describe("SHAPE_ROWS", () => {
  it("has a line for every shape the pills draw", () => {
    for (const shape of SHAPE_ORDER) {
      expect(SHAPE_ROWS[shape].title).not.toBe("");
      expect(SHAPE_ROWS[shape].detail).not.toBe("");
    }
  });
});

describe("fitLine", () => {
  const third =
    "The third sits outside that total on purpose, so it adds rather than filters.";

  it("spells the total the first two add up to", () => {
    expect(fitLine(31, routePillsFor(DEFAULT_SEARCH))).toBe(
      `The first two add up to the thirty-one that match. ${third}`,
    );
  });

  it("leaves could-convert out of that total even when it is on", () => {
    const widened: SearchState = {
      ...DEFAULT_SEARCH,
      shapes: ["suite", "ground", "convert"],
    };
    // The button would say 57; the sentence is explaining why 26 of those are extra.
    expect(fitLine(countFor(widened), routePillsFor(widened))).toBe(
      `The first two add up to the thirty-one that match. ${third}`,
    );
  });

  it("recounts when one of the first two is off", () => {
    const ground: SearchState = { ...DEFAULT_SEARCH, shapes: ["ground"] };
    expect(fitLine(countFor(ground), routePillsFor(ground))).toBe(
      `The first two add up to the twelve that match. ${third}`,
    );
  });

  it("withholds the number while it is being worked out", () => {
    expect(fitLine(null, routePillsFor(DEFAULT_SEARCH))).toBe(
      `The first two add up to the homes that match. ${third}`,
    );
  });

  it("says so when neither of the first two is on", () => {
    const none: SearchState = { ...DEFAULT_SEARCH, shapes: ["convert"] };
    expect(fitLine(countFor(none), routePillsFor(none))).toBe(
      `The first two are off, so nothing matches yet. ${third}`,
    );
  });
});

/**
 * The price section draws the count table rather than a second source, so
 * the bars are checked against `countFor` and then against the figures a
 * reviewer will see, so that a change in the table shows up here by name.
 */
describe("priceBarsFor", () => {
  it("draws one bar per declared ceiling and one for none, in order", () => {
    expect(priceBarsFor(DEFAULT_SEARCH).map((b) => b.ceiling)).toEqual([
      ...CEILINGS,
      null,
    ]);
  });

  it("prices each ceiling with everything else as it is", () => {
    const bars = priceBarsFor(DEFAULT_SEARCH);
    expect(bars.map((b) => b.count)).toEqual([
      countFor({ ...DEFAULT_SEARCH, ceiling: 1_050_000 }),
      countFor({ ...DEFAULT_SEARCH, ceiling: 1_150_000 }),
      SEARCH.matches,
      countFor({ ...DEFAULT_SEARCH, ceiling: 1_350_000 }),
      countFor({ ...DEFAULT_SEARCH, underBudget: false }),
    ]);
    expect(bars.map((b) => b.count)).toEqual([18, 24, 31, 39, 54]);
  });

  it("labels in full dollars, and the last one in words", () => {
    expect(priceBarsFor(DEFAULT_SEARCH).map((b) => b.label)).toEqual([
      "$1,050,000",
      "$1,150,000",
      "$1,250,000",
      "$1,350,000",
      "No ceiling",
    ]);
  });

  it("selects hers when no ceiling was chosen, and the chosen one otherwise", () => {
    const selected = (state: SearchState) =>
      priceBarsFor(state).find((b) => b.selected)!.ceiling;
    expect(selected(DEFAULT_SEARCH)).toBe(SEARCH.budget);
    expect(selected({ ...DEFAULT_SEARCH, ceiling: 1_050_000 })).toBe(1_050_000);
    expect(priceBarsFor(DEFAULT_SEARCH).filter((b) => b.selected)).toHaveLength(1);
  });

  it("selects No ceiling once the budget is off", () => {
    const bars = priceBarsFor({ ...DEFAULT_SEARCH, underBudget: false });
    expect(bars.filter((b) => b.selected).map((b) => b.ceiling)).toEqual([null]);
  });

  it("scales the tallest bar to one and never draws below the baseline", () => {
    const bars = priceBarsFor(DEFAULT_SEARCH);
    expect(Math.max(...bars.map((b) => b.share))).toBe(1);
    expect(bars.map((b) => b.share)).toEqual(
      bars.map((b) => b.count / 54),
    );
    // With a temple and a grocery required the table goes under zero at the
    // low ceilings. The bar stops at the floor; the number is the table's.
    const harsh = { ...DEFAULT_SEARCH, nearTemple: true, nearGrocery: true };
    for (const bar of priceBarsFor(harsh)) {
      expect(bar.share, bar.label).toBeGreaterThanOrEqual(0);
    }
  });

  it("ignores the minimum, so the histogram is the market and not her selection", () => {
    const without = priceBarsFor(DEFAULT_SEARCH).map((b) => b.count);
    const withFloor = priceBarsFor({ ...DEFAULT_SEARCH, floor: 1_150_000 }).map((b) => b.count);
    expect(withFloor).toEqual(without);
  });

  it("follows the requirements, so the bars move when a switch does", () => {
    const withTemple = priceBarsFor({ ...DEFAULT_SEARCH, nearTemple: true });
    const without = priceBarsFor(DEFAULT_SEARCH);
    for (const [i, bar] of withTemple.entries()) {
      expect(bar.count).toBeLessThan(without[i]!.count);
    }
  });
});

describe("clearable", () => {
  it("is true on the search she arrives with", () => {
    expect(clearable(DEFAULT_SEARCH)).toBe(true);
  });

  it("is false once the ceiling and every requirement are off", () => {
    expect(
      clearable({
        ...DEFAULT_SEARCH,
        underBudget: false,
        nearHospital: false,
        nearTransit: false,
        nearTemple: false,
        nearGrocery: false,
      }),
    ).toBe(false);
  });

  it("counts a ceiling alone, and a requirement alone", () => {
    const bare = {
      ...DEFAULT_SEARCH,
      nearHospital: false,
      nearTransit: false,
      nearTemple: false,
      nearGrocery: false,
    };
    expect(clearable({ ...bare, underBudget: true })).toBe(true);
    expect(clearable({ ...bare, underBudget: false, nearGrocery: true })).toBe(true);
  });

  it("does not count the shapes, which the bar owns", () => {
    const cleared = {
      ...DEFAULT_SEARCH,
      underBudget: false,
      nearHospital: false,
      nearTransit: false,
      nearTemple: false,
      nearGrocery: false,
    };
    expect(clearable({ ...cleared, shapes: ["suite", "ground", "convert"] })).toBe(false);
    expect(clearable({ ...cleared, shapes: [] })).toBe(false);
  });
});
