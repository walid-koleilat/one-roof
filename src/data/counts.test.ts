import { describe, expect, it } from "vitest";
import {
  ARRIVAL_SHOWN,
  BENDALE_HOMES,
  countFor,
  CEILINGS,
  DEFAULT_SEARCH,
  matchesSearch,
  needOn,
  NEEDS,
  NEST,
  SAMPLE,
  SAVED,
  SEARCH,
  TABLE_ASSUMES,
  TOO_FEW,
  withinBudget,
  type Need,
  type SearchState,
  MINUTE_STOPS,
  NEED_COST_AT,
  BED_STOPS,
  BATH_STOPS,
  listingsFor,
  CHAT_ROOMS,
} from "./counts";
import { AREA_SHAPES, AREA_TOTAL, LISTINGS } from "./listings";
import {
  CAST,
  SAVED_COLLECTIONS,
  SAVED_HOMES,
  SAVED_SEARCHES,
  savedHomeIds,
  STAGES,
} from "./saved";

/**
 * The counts are a claim the reader can check, so they are a test.
 *
 * Four screens each state a number, and each is a narrower slice of the one
 * before it. When those numbers lived in components they drifted - the advert
 * said eleven over a map of five - and the only reliable defence is a test that
 * goes red rather than a reviewer who notices.
 */
describe("the counts nest", () => {
  it("gets smaller at every step, which is the whole rule", () => {
    for (let i = 1; i < NEST.length; i++) {
      const wider = NEST[i - 1]!;
      const narrower = NEST[i]!;
      expect(
        narrower.count,
        `${narrower.label} (${narrower.count}) must fit inside ${wider.label} (${wider.count})`,
      ).toBeLessThanOrEqual(wider.count);
    }
  });

  it("splits the search into exactly the two shapes she asked for", () => {
    expect(SEARCH.legalSuite + SEARCH.groundFloor).toBe(SEARCH.matches);
  });

  it("keeps could-convert outside the total, because it is not a suite", () => {
    // A basement that might take a suite one day is not a house with one.
    // Folding it in would be the product agreeing with her hopes.
    expect(SEARCH.couldConvert).toBeGreaterThan(0);
    expect(SEARCH.matches).toBeLessThan(SEARCH.matches + SEARCH.couldConvert);
  });

  it("never claims more matches than there are homes in Bendale", () => {
    expect(SEARCH.matches).toBeLessThanOrEqual(BENDALE_HOMES);
  });

  it("shows fewer than it found, which is what the wall is for", () => {
    expect(ARRIVAL_SHOWN).toBeLessThan(SEARCH.matches);
  });

  it("has her save fewer out of Bendale than she was shown", () => {
    expect(SAVED.fromBendale).toBeLessThanOrEqual(ARRIVAL_SHOWN);
  });
});

/**
 * Saved, across every search - the counts the page prints and nothing used to
 * check. Eleven lived in a component while this file said five.
 */
describe("saved, across every search", () => {
  const listingIds = new Set(LISTINGS.map((l) => l.id));

  it("has exactly one total, and the fixture is it", () => {
    expect(savedHomeIds().length).toBe(SAVED.total);
  });

  it("counts Bendale's slice the way the nest does", () => {
    expect(SAVED_SEARCHES[0]!.homeIds.length).toBe(SAVED.fromBendale);
  });

  it("has a record for every home she saved, not just the first search's", () => {
    // This is the test that permanently retires the "Saved just now" stub.
    // Pick Woburn or Cedarbrae and every card used to say nothing had happened.
    const recorded = new Set(SAVED_HOMES.map((h) => h.listingId));
    const missing = savedHomeIds().filter((id) => !recorded.has(id));
    expect(missing).toEqual([]);
  });

  it("names only homes that have a card", () => {
    for (const search of SAVED_SEARCHES) {
      for (const id of [...search.homeIds, ...search.newIds]) {
        expect(listingIds.has(id), `${search.id} names ${id}`).toBe(true);
      }
    }
    for (const c of SAVED_COLLECTIONS) {
      for (const id of c.homeIds) {
        expect(listingIds.has(id), `${c.id} names ${id}`).toBe(true);
      }
    }
  });

  it("counts the searches and the collections it says it does", () => {
    expect(SAVED_SEARCHES.length).toBe(SAVED.searches);
    expect(SAVED_COLLECTIONS.length).toBe(SAVED.collections);
  });

  it("counts new matches once, even when two searches found the same one", () => {
    // 40 Ellesmere turned up in Bendale and in Cedarbrae. It is one new home.
    const union = new Set(SAVED_SEARCHES.flatMap((s) => s.newIds));
    expect(union.size).toBe(SAVED.newSinceTuesday);
  });

  it("lets a collection hold only homes she has saved, and never nothing", () => {
    const saved = new Set(savedHomeIds());
    for (const c of SAVED_COLLECTIONS) {
      expect(c.homeIds.length, `${c.id} is empty`).toBeGreaterThan(0);
      for (const id of c.homeIds) {
        expect(saved.has(id), `${c.id} holds ${id}, which is not saved`).toBe(true);
      }
    }
  });

  it("never gives a collection a way to grow on its own", () => {
    // A search has `newIds` and can email her. A collection is a box. If the
    // field ever appears here the two have been confused.
    for (const c of SAVED_COLLECTIONS) {
      expect(Object.keys(c)).not.toContain("newIds");
    }
  });

  it("only shares with people who exist", () => {
    // The assertion that would have caught "Kavi".
    for (const s of SAVED_SEARCHES) {
      for (const p of s.sharedWith) expect(CAST[p]).toBeDefined();
    }
    for (const c of SAVED_COLLECTIONS) {
      for (const p of c.sharedWith) expect(CAST[p]).toBeDefined();
    }
  });

  it("puts something under every stage in the rail", () => {
    // A smart collection with nothing in it is a heading with no reason.
    for (const stage of STAGES) {
      expect(
        SAVED_HOMES.some((h) => h.stage === stage),
        `nothing is at "${stage}"`,
      ).toBe(true);
    }
  });
});

describe("the advert's own count", () => {
  it("still adds up to the number in its sub-line", () => {
    expect(AREA_SHAPES.reduce((n, s) => n + s.count, 0)).toBe(AREA_TOTAL);
  });

  it("sits inside the search rather than beside it", () => {
    expect(AREA_TOTAL).toBeLessThanOrEqual(SEARCH.matches);
  });
});

describe("the sample we can actually show", () => {
  it("never contradicts the total it is a sample of", () => {
    expect(SAMPLE.length).toBeLessThanOrEqual(SEARCH.matches);
  });

  it("holds nothing over the budget she set", () => {
    for (const listing of SAMPLE) {
      expect(
        listing.askingPrice.value,
        `${listing.address} is over the stated budget`,
      ).toBeLessThanOrEqual(SEARCH.budget);
    }
  });

  it("holds only the two shapes the search asked for", () => {
    for (const listing of SAMPLE) {
      expect([listing.address, listing.suite]).toEqual([
        listing.address,
        expect.stringMatching(/^(legal-suite|ground-floor)$/),
      ]);
    }
  });

  it("drops 7 Galloway, which is the point of the exclusion panel", () => {
    // It has the kitchen and no record. The search must not quietly keep it.
    const addresses = SAMPLE.map((l) => l.address);
    expect(addresses).not.toContain("7 Galloway Road");
  });

  it("drops anything over budget rather than rounding it in", () => {
    const dropped = LISTINGS.filter((l) => !withinBudget([l]).length);
    expect(dropped.map((l) => l.address)).toContain("7 Galloway Road");
  });
});

describe("every address is unique, and so is every price", () => {
  it("names no house twice", () => {
    const addresses = LISTINGS.map((l) => l.address);
    expect(new Set(addresses).size).toBe(addresses.length);
  });

  it("gives no two homes the same asking price", () => {
    // This is the test that would have caught the drift: the search page had
    // grown its own addresses that reused prices from the chat page, so the
    // same house appeared twice under two names.
    const prices = LISTINGS.map((l) => l.askingPrice.value);
    expect(new Set(prices).size).toBe(prices.length);
  });

  it("gives every home its own id", () => {
    const ids = LISTINGS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only shows a price cut where there is a price to cut from", () => {
    for (const listing of LISTINGS) {
      if (!listing.previousPrice) continue;
      expect(
        listing.previousPrice.value,
        `${listing.address} was not actually cut`,
      ).toBeGreaterThan(listing.askingPrice.value);
    }
  });

  it("never offers rent on any home", () => {
    // Her parents live in the suite. Money she cannot collect is not income,
    // and a product that counts it is flattering her rather than helping. The
    // idea was removed rather than caveated, and this stops it coming back.
    for (const listing of LISTINGS) {
      expect(Object.keys(listing)).not.toContain("couldRent");
    }
  });

  it("finds every photograph under /homes", () => {
    for (const listing of LISTINGS) {
      expect(listing.photos.length).toBeGreaterThan(0);
      for (const photo of listing.photos) {
        expect(photo).toMatch(/^\/homes\/[a-z0-9-]+\.jpg$/);
      }
    }
  });
});

describe("matchesSearch", () => {
  it("is the filter the copy describes, not a hand-written list", () => {
    const result = matchesSearch(LISTINGS);
    expect(result.every((l) => l.askingPrice.value <= SEARCH.budget)).toBe(true);
    expect(result.some((l) => l.suite === "could-convert")).toBe(false);
  });
});

/**
 * The two requirements she can add are priced against the design, not
 * against each other. The board draws a temple leaving twelve of the
 * thirty-one and a grocery leaving nineteen, and those are the figures the
 * cost tables were set to produce.
 */
describe("the nearby requirements", () => {
  it("starts where the tables assume, so the default search still counts 31", () => {
    expect(countFor(DEFAULT_SEARCH)).toBe(SEARCH.matches);
    for (const need of NEEDS) {
      expect(needOn(DEFAULT_SEARCH, need)).toBe(TABLE_ASSUMES[need]);
    }
  });

  it("reads an unset requirement the way the table does", () => {
    const bare: SearchState = { shapes: ["suite", "ground"], inBendale: true, underBudget: true };
    expect(countFor(bare)).toBe(SEARCH.matches);
    expect(needOn(bare, "nearHospital")).toBe(true);
    expect(needOn(bare, "nearTemple")).toBe(false);
  });

  it("leaves twelve of the thirty-one when a temple is required", () => {
    expect(countFor({ ...DEFAULT_SEARCH, nearTemple: true })).toBe(12);
  });

  it("leaves nineteen of the thirty-one when a grocery is required", () => {
    expect(countFor({ ...DEFAULT_SEARCH, nearGrocery: true })).toBe(19);
  });

  it("gives eight back for the hospital and five for the bus, as before", () => {
    expect(countFor({ ...DEFAULT_SEARCH, nearHospital: false })).toBe(39);
    expect(countFor({ ...DEFAULT_SEARCH, nearTransit: false })).toBe(36);
  });

  it("puts both new requirements together under the too-few line", () => {
    // Additive costs, so requiring both leaves nothing on the default search.
    // That is the state the panel exists to talk her out of, not a bug.
    const both = countFor({ ...DEFAULT_SEARCH, nearTemple: true, nearGrocery: true });
    expect(both).toBeLessThan(TOO_FEW);
    expect(both).toBeGreaterThanOrEqual(0);
  });

  it("never counts below zero, whatever she turns on", () => {
    const shapes: readonly SearchState["shapes"][] = [
      ["suite"],
      ["ground"],
      ["convert"],
      ["suite", "ground"],
      ["suite", "ground", "convert"],
    ];
    const settings: Partial<Record<Need, boolean>>[] = [];
    for (const h of [true, false])
      for (const t of [true, false])
        for (const m of [true, false])
          for (const g of [true, false])
            settings.push({ nearHospital: h, nearTransit: t, nearTemple: m, nearGrocery: g });

    for (const inBendale of [true, false]) {
      for (const underBudget of [true, false]) {
        for (const s of shapes) {
          for (const needs of settings) {
            const state: SearchState = { shapes: s, inBendale, underBudget, ...needs };
            expect(
              countFor(state),
              `${s.join("+")} bendale=${String(inBendale)} budget=${String(underBudget)} ${JSON.stringify(needs)}`,
            ).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });

  it("scales the cost with the area, like the hospital and the bus do", () => {
    const wide = { ...DEFAULT_SEARCH, inBendale: false };
    const cost = countFor(wide) - countFor({ ...wide, nearTemple: true });
    const narrow = countFor(DEFAULT_SEARCH) - countFor({ ...DEFAULT_SEARCH, nearTemple: true });
    expect(cost).toBe(narrow * 5);
  });
});

describe("the ceiling she can move", () => {
  it("is hers by default, and moving it moves the count the way a ceiling should", () => {
    const at = (ceiling: (typeof CEILINGS)[number]) =>
      countFor({ ...DEFAULT_SEARCH, ceiling });
    expect(at(1_250_000)).toBe(countFor(DEFAULT_SEARCH));
    expect(at(1_050_000)).toBeLessThan(at(1_150_000));
    expect(at(1_150_000)).toBeLessThan(at(1_250_000));
    expect(at(1_250_000)).toBeLessThan(at(1_350_000));
    // No ceiling at all is more than the highest ceiling offered.
    expect(countFor({ ...DEFAULT_SEARCH, underBudget: false })).toBeGreaterThan(
      at(1_350_000),
    );
  });
});

describe("the floor", () => {
  it("never counts below zero, however much she requires at a low ceiling", () => {
    const tight = countFor({
      ...DEFAULT_SEARCH,
      ceiling: 1_050_000,
      nearTemple: true,
      nearGrocery: true,
    });
    expect(tight).toBe(0);
  });
});

describe("how far is near", () => {
  it("costs more the tighter a requirement is drawn, and nothing extra at the base", () => {
    const base = countFor(DEFAULT_SEARCH);
    expect(countFor({ ...DEFAULT_SEARCH, minutes: { nearHospital: 15 } })).toBe(base);
    expect(countFor({ ...DEFAULT_SEARCH, minutes: { nearHospital: 10 } })).toBeLessThan(base);
    expect(countFor({ ...DEFAULT_SEARCH, minutes: { nearHospital: 30 } })).toBeGreaterThan(base);
    // Declared at every stop, and never cheaper for being closer.
    for (const need of NEEDS) {
      for (const shape of ["suite", "ground", "convert"] as const) {
        const costs = MINUTE_STOPS.map((m) => NEED_COST_AT[need][m][shape]);
        for (let i = 1; i < costs.length; i++) expect(costs[i]).toBeLessThanOrEqual(costs[i - 1]!);
      }
    }
  });
});

describe("rooms", () => {
  it("costs nothing at any, and more with every bedroom or bathroom asked for", () => {
    const base = countFor(DEFAULT_SEARCH);
    expect(countFor({ ...DEFAULT_SEARCH, minBeds: 1, minBaths: 1 })).toBe(base);
    const byBeds = BED_STOPS.map((b) => countFor({ ...DEFAULT_SEARCH, minBeds: b }));
    const byBaths = BATH_STOPS.map((b) => countFor({ ...DEFAULT_SEARCH, minBaths: b }));
    for (const series of [byBeds, byBaths]) {
      for (let i = 1; i < series.length; i++) expect(series[i]).toBeLessThanOrEqual(series[i - 1]!);
    }
    expect(byBeds[4]).toBeLessThan(base);
    // What the conversation came to is already true of every home in the
    // search, so arriving there costs nothing.
    expect(countFor({ ...DEFAULT_SEARCH, minBeds: CHAT_ROOMS.beds, minBaths: CHAT_ROOMS.baths })).toBe(base);
  });

  it("keeps every card in the sample at the rooms the conversation came to", () => {
    const all = listingsFor(DEFAULT_SEARCH, LISTINGS);
    const preset = listingsFor(
      { ...DEFAULT_SEARCH, minBeds: CHAT_ROOMS.beds, minBaths: CHAT_ROOMS.baths },
      LISTINGS,
    );
    expect(preset.map((l) => l.id)).toEqual(all.map((l) => l.id));
  });

  it("filters the sample by the rooms each home actually has", () => {
    const all = listingsFor(DEFAULT_SEARCH, LISTINGS);
    const fourBeds = listingsFor({ ...DEFAULT_SEARCH, minBeds: 4 }, LISTINGS);
    expect(fourBeds.length).toBeLessThanOrEqual(all.length);
    for (const l of fourBeds) expect(l.metrics.beds).toBeGreaterThanOrEqual(4);
  });
});

describe("the minimum she can set", () => {
  it("is the count under the ceiling less the count under the minimum", () => {
    const under = (ceiling: (typeof CEILINGS)[number]) =>
      countFor({ ...DEFAULT_SEARCH, ceiling });
    expect(countFor({ ...DEFAULT_SEARCH, floor: 1_150_000 })).toBe(
      countFor(DEFAULT_SEARCH) - under(1_150_000),
    );
    // With no ceiling the same subtraction holds against the whole market.
    expect(countFor({ ...DEFAULT_SEARCH, underBudget: false, floor: 1_050_000 })).toBe(
      countFor({ ...DEFAULT_SEARCH, underBudget: false }) - under(1_050_000),
    );
  });

  it("drops the sample homes at or under it", () => {
    for (const l of listingsFor({ ...DEFAULT_SEARCH, floor: 1_150_000 }, LISTINGS)) {
      expect(l.askingPrice.value).toBeGreaterThan(1_150_000);
    }
  });
});
