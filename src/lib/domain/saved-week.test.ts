import { describe, expect, it } from "vitest";
import {
  SAVED_COLLECTIONS,
  SAVED_HOMES,
  SAVED_SEARCHES,
  WHEN_ORDER,
  type Condition,
  type Note,
  type SavedHome,
} from "@/data/saved";
import { initSession, type SavedSession } from "./saved-session";
import { nextItem, nextLine, weekFor, type WeekItem } from "./saved-week";

/* ------------------------------------------------------------------ */
/* Builders                                                            */
/* ------------------------------------------------------------------ */

// The session is built by hand rather than through the reducer, which may
// not exist yet. `initSession` is part of the contract and gives an honest
// empty state to spread over.
function session(overrides: Partial<SavedSession> = {}): SavedSession {
  return {
    ...initSession({
      collections: SAVED_COLLECTIONS,
      // The fixture always has a first search; a bare string keeps the
      // builder total without asserting on it.
      firstSearchId: SAVED_SEARCHES[0]?.id ?? "",
    }),
    ...overrides,
  };
}

function home(overrides: Partial<SavedHome> & Pick<SavedHome, "listingId">): SavedHome {
  return {
    savedOn: "12 August",
    history: [],
    notes: [],
    thread: [],
    withAgent: [],
    papers: [],
    ...overrides,
  };
}

function note(id: string, what: string, done?: boolean): Note {
  return done === undefined ? { id, what } : { id, what, done };
}

function condition(id: string, what: string, by: string): Condition {
  return { id, what, by, who: "anusha" };
}

const ids = (items: readonly WeekItem[]) => items.map((i) => i.id);

/* ------------------------------------------------------------------ */
/* weekFor                                                             */
/* ------------------------------------------------------------------ */

describe("weekFor", () => {
  const ellendale = home({
    listingId: "ellendale-64",
    stage: "to-view",
    notes: [note("e-n0", "Measure the basement ceiling."), note("e-n1", "Look at the side door.")],
  });

  it("drops a task once she ticks it, and brings it back when she unticks", () => {
    const ticked = session({ ticked: { "ellendale-64": ["e-n0"] } });
    expect(ids(weekFor([ellendale], ticked))).toEqual(["e-n1"]);

    // Unticking is the tick no longer being in the session. Nothing else changes.
    const unticked = session({ ticked: { "ellendale-64": [] } });
    expect(ids(weekFor([ellendale], unticked))).toEqual(["e-n0", "e-n1"]);
  });

  it("drops a fixture note already marked done", () => {
    const withDone = home({
      listingId: "bellamy-18",
      notes: [note("b-n0", "Check the rail.", true), note("b-n1", "Photograph the steps.")],
    });
    expect(ids(weekFor([withDone], session()))).toEqual(["b-n1"]);
  });

  it("drops a condition once she clears it", () => {
    const closing = home({
      listingId: "ellendale-64",
      stage: "closing",
      conditions: [condition("e-c0", "Financing", "by Tuesday"), condition("e-c1", "Keys", "30 October")],
    });
    const cleared = session({ conditionsDone: { "ellendale-64": ["e-c0"] } });
    expect(ids(weekFor([closing], cleared))).toEqual(["e-c1"]);
  });

  it("takes nothing from a home with no open notes and no conditions", () => {
    // History is present and it is a visit. It still is not a task; history
    // is what the market did, and this file never reads it.
    const quiet = home({
      listingId: "pitfield-32",
      history: [{ id: "p-h0", what: "Visit booked for Saturday 2pm", when: "Yesterday", kind: "visit" }],
      afterVisit: "Bright at the back.",
    });
    expect(weekFor([quiet], session())).toEqual([]);
  });

  it("takes nothing from a home that is gone, even one with notes", () => {
    const gone = home({
      listingId: "galloway-7",
      stage: "gone",
      notes: [note("g-n0", "Ask about the road.")],
      conditions: [condition("g-c0", "Inspection", "this Saturday")],
    });
    expect(weekFor([gone], session())).toEqual([]);
  });

  it("treats a stage she set to gone this session the same way", () => {
    const setGone = session({ stages: { "ellendale-64": "gone" } });
    expect(weekFor([ellendale], setGone)).toEqual([]);
  });

  it("reads a cleared stage as no stage, so a fixture gone comes back", () => {
    // `null` in `session.stages` is her clearing the tag, not the key being
    // absent. The home is no longer gone and its notes are hers again.
    const gone = home({
      listingId: "galloway-7",
      stage: "gone",
      notes: [note("g-n0", "Ask about the road.")],
    });
    const cleared = session({ stages: { "galloway-7": null } });
    expect(ids(weekFor([gone], cleared))).toEqual(["g-n0"]);
  });

  it("puts dated conditions before undated notes, in WHEN_ORDER", () => {
    const closing = home({
      listingId: "ellendale-64",
      stage: "closing",
      notes: [note("e-n0", "Measure the basement ceiling.")],
      conditions: [
        // Deliberately out of order in the record.
        condition("e-c2", "Keys", "30 October"),
        condition("e-c0", "Inspection", "this Saturday"),
        condition("e-c1", "Financing", "by Tuesday"),
      ],
    });
    const week = weekFor([closing], session());

    expect(ids(week)).toEqual(["e-c0", "e-c1", "e-c2", "e-n0"]);

    const dated = week.filter((i) => i.when !== "");
    for (let i = 1; i < dated.length; i += 1) {
      // The lookups are total here: every `when` was just checked non-empty,
      // and a later test asserts each one is a key of WHEN_ORDER.
      expect(WHEN_ORDER[dated[i]!.when]!).toBeGreaterThanOrEqual(WHEN_ORDER[dated[i - 1]!.when]!);
    }
    const lastDated = Math.max(...dated.map((i) => i.order));
    for (const item of week.filter((i) => i.when === "")) {
      expect(item.order).toBeGreaterThan(lastDated);
    }
  });

  it("keeps undated notes grouped by home in the order given, then note order", () => {
    const first = home({
      listingId: "ellendale-64",
      notes: [note("e-n0", "One."), note("e-n1", "Two.")],
    });
    const second = home({
      listingId: "bellamy-18",
      notes: [note("b-n0", "Three.")],
    });
    expect(ids(weekFor([first, second], session()))).toEqual(["e-n0", "e-n1", "b-n0"]);
    expect(ids(weekFor([second, first], session()))).toEqual(["b-n0", "e-n0", "e-n1"]);
  });

  it("shows a note she added this session, in the same shape as a fixture note", () => {
    const withAdded = session({
      added: { "ellendale-64": [note("ellendale-64-a1", "Bring the tape measure.")] },
    });
    const week = weekFor([ellendale], withAdded);
    const added = week.find((i) => i.id === "ellendale-64-a1");
    const fixture = week.find((i) => i.id === "e-n0");

    expect(added).toBeDefined();
    expect(fixture).toBeDefined();
    // Same keys, same kind, same absence of a date. Nothing marks it as hers
    // from this session rather than hers from the fixture.
    expect(Object.keys(added!).sort()).toEqual(Object.keys(fixture!).sort());
    expect(added).toMatchObject({ kind: "task", when: "", listingId: "ellendale-64" });
    // Added notes come after the fixture's, which is where she saw them appear.
    expect(ids(week)).toEqual(["e-n0", "e-n1", "ellendale-64-a1"]);
  });

  it("drops an added note once she ticks it, like any other", () => {
    const s = session({
      added: { "ellendale-64": [note("ellendale-64-a1", "Bring the tape measure.")] },
      ticked: { "ellendale-64": ["ellendale-64-a1"] },
    });
    expect(ids(weekFor([ellendale], s))).toEqual(["e-n0", "e-n1"]);
  });

  it("carries the words from the record unchanged", () => {
    const closing = home({
      listingId: "ellendale-64",
      stage: "closing",
      notes: [note("e-n0", "Measure the basement ceiling. It needs 6 ft 5 in.")],
      conditions: [condition("e-c0", "Financing", "by Tuesday")],
    });
    const week = weekFor([closing], session());
    expect(week.map((i) => i.what)).toEqual([
      "Financing",
      "Measure the basement ceiling. It needs 6 ft 5 in.",
    ]);
    expect(week.find((i) => i.kind === "condition")?.who).toBe("anusha");
    expect(week.find((i) => i.kind === "task")?.who).toBeUndefined();
  });

  it("only ever writes a WHEN_ORDER phrase into when, or nothing", () => {
    const closing = home({
      listingId: "ellendale-64",
      stage: "closing",
      notes: [note("e-n0", "Look at the step on Saturday.")],
      conditions: [condition("e-c0", "Inspection", "this Saturday")],
    });
    const everything = [
      ...weekFor(SAVED_HOMES, session()),
      ...weekFor([closing], session({ added: { "ellendale-64": [note("a1", "By 14 Oct, call Arun.")] } })),
    ];
    expect(everything.length).toBeGreaterThan(0);
    for (const item of everything) {
      if (item.when === "") continue;
      expect(WHEN_ORDER[item.when], `"${item.when}" is not placed in WHEN_ORDER`).toBeDefined();
    }
    // The two notes that name a day in their words still have no date.
    const worded = everything.filter((i) => i.id === "e-n0" || i.id === "a1");
    expect(worded).toHaveLength(2);
    for (const item of worded) expect(item.when).toBe("");
  });

  it("reads the fixture as its open notes and uncleared conditions, and nothing from a gone home", () => {
    // The expectation is read off the fixture rather than written down, so
    // a new record or a note ticked in `saved.ts` moves both sides at once.
    const standing = SAVED_HOMES.filter((h) => h.stage !== "gone");
    const openNotes = standing.flatMap((h) => h.notes.filter((n) => !n.done));
    const openConditions = standing.flatMap((h) => (h.conditions ?? []).filter((c) => !c.done));
    const doneNotes = standing.flatMap((h) => h.notes.filter((n) => n.done));
    // The fixture has to exercise every branch or this proves nothing.
    expect(openNotes.length).toBeGreaterThan(1);
    expect(openConditions.length).toBeGreaterThan(1);
    expect(doneNotes.length).toBeGreaterThan(0);
    expect(SAVED_HOMES.some((h) => h.stage === "gone")).toBe(true);

    const week = weekFor(SAVED_HOMES, session());
    const tasks = week.filter((i) => i.kind === "task");
    const conditions = week.filter((i) => i.kind === "condition");

    expect(ids(tasks).sort()).toEqual(openNotes.map((n) => n.id).sort());
    expect(ids(conditions).sort()).toEqual(openConditions.map((c) => c.id).sort());
    for (const done of doneNotes) expect(ids(week)).not.toContain(done.id);
    expect(new Set(week.map((i) => i.listingId))).toEqual(
      new Set(standing.filter((h) => h.notes.some((n) => !n.done) || (h.conditions ?? []).some((c) => !c.done)).map((h) => h.listingId)),
    );
  });
});

/* ------------------------------------------------------------------ */
/* nextItem and nextLine                                               */
/* ------------------------------------------------------------------ */

describe("the next thing with a date on it", () => {
  it("is the nearest uncleared condition, across every home", () => {
    const item = nextItem(SAVED_HOMES, session());
    expect(item).not.toBeNull();
    expect(item!.kind).toBe("condition");
    const dated = weekFor(SAVED_HOMES, session()).filter((i) => i.when !== "");
    expect(item!.id).toBe(dated[0]!.id);
  });

  it("skips a condition that has already cleared", () => {
    const item = nextItem(SAVED_HOMES, session());
    const home = SAVED_HOMES.find((h) => h.listingId === item!.listingId)!;
    const condition = (home.conditions ?? []).find((c) => c.id === item!.id)!;
    expect(condition.done).toBeFalsy();
  });

  it("never returns an undated task, however urgent it reads", () => {
    // "Stand in the suite while someone walks upstairs" has no date. Reading
    // a day out of a sentence would be the product inventing a calendar.
    const homes = [
      home({
        listingId: "only-notes",
        notes: [note("n1", "Get the handrail quoted before the 30th.")],
      }),
    ];
    expect(nextItem(homes, session())).toBeNull();
  });

  it("goes quiet when everything dated has cleared", () => {
    const only = home({
      listingId: "ellendale-64",
      stage: "closing",
      conditions: [condition("e-c0", "Financing", "by Tuesday")],
    });
    const cleared = session({ conditionsDone: { "ellendale-64": ["e-c0"] } });
    expect(nextItem([only], cleared)).toBeNull();
  });

  it("names the house, the day and whoever holds it", () => {
    const item: WeekItem = {
      id: "e-c1",
      kind: "condition",
      listingId: "ellendale-64",
      what: "Inspection",
      when: "this Saturday",
      order: 2,
      who: "anusha",
    };
    expect(nextLine(item, "64 Ellendale Drive")).toBe(
      "Inspection at 64 Ellendale Drive, this Saturday. Anusha holds it.",
    );
  });

  it("drops the house when the panel is already showing it", () => {
    const item: WeekItem = {
      id: "e-c1",
      kind: "condition",
      listingId: "ellendale-64",
      what: "Inspection",
      when: "this Saturday",
      order: 2,
      who: "anusha",
    };
    expect(nextLine(item)).toBe("Inspection, this Saturday. Anusha holds it.");
  });

  it("says who a thing is with, where it is not one person in the cast", () => {
    // "Arun's bank holds it" and "You and Arun holds it" are the two ways a
    // sentence that guesses at number goes wrong. This one does not guess.
    const item: WeekItem = {
      id: "e-c2",
      kind: "condition",
      listingId: "ellendale-64",
      what: "Financing, letter in hand",
      when: "by Tuesday",
      order: 5,
      who: "arun",
      holder: "Arun's bank",
    };
    expect(nextLine(item)).toBe(
      "Financing, letter in hand, by Tuesday. With Arun's bank.",
    );
  });

  it("carries a holder out of the fixture into the item", () => {
    const withHolder = home({
      listingId: "ellendale-64",
      stage: "closing",
      conditions: [
        { id: "e-c0", what: "Deposit", by: "Wednesday", who: "nirosha", holder: "You and Arun" },
      ],
    });
    expect(nextItem([withHolder], session())?.holder).toBe("You and Arun");
  });
});
