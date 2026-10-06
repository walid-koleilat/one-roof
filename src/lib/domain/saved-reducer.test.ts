import { describe, expect, it } from "vitest";
import { SAVED_COLLECTIONS, SAVED_SEARCHES, WHEN_ORDER } from "@/data/saved";
import { savedReducer } from "./saved-reducer";
import {
  EMPTY_SEARCH_SESSION,
  initSession,
  searchSession,
  type SavedAction,
  type SavedSession,
} from "./saved-session";

/**
 * The reducer's promises, as tests.
 *
 * The first one is the reason the reducer exists: what she does to one search
 * stays on that search. The rest hold the shape to what the page relies on -
 * that nothing is mutated, that a blank input is a no-op, that an id she
 * creates is deterministic - because those are the properties a component
 * cannot check for itself.
 */

const seed = (): SavedSession =>
  initSession({
    collections: SAVED_COLLECTIONS,
    firstSearchId: "bendale-suite",
  });

const apply = (state: SavedSession, ...actions: SavedAction[]): SavedSession =>
  actions.reduce(savedReducer, state);

const VOICE = { seconds: "0:09" };

describe("what she does to one search stays on that search", () => {
  it("removing 7 Brimley from Cedarbrae leaves Bendale's new matches alone", () => {
    // The regression. One removed list for the whole page took it out of both.
    const after = savedReducer(seed(), {
      type: "remove",
      searchId: "cedarbrae-add",
      listingId: "brimley-7",
    });
    expect(searchSession(after, "cedarbrae-add").removed).toContain("brimley-7");
    expect(after.perSearch["bendale-suite"]).toBeUndefined();
    expect(searchSession(after, "bendale-suite")).toBe(EMPTY_SEARCH_SESSION);
    expect(searchSession(after, "bendale-suite").removed).not.toContain("brimley-7");
  });

  it("leaves 7 Brimley in what Bendale would still show as new", () => {
    const after = savedReducer(seed(), {
      type: "remove",
      searchId: "cedarbrae-add",
      listingId: "brimley-7",
    });
    const bendale = SAVED_SEARCHES.find((s) => s.id === "bendale-suite");
    const removedThere = searchSession(after, "bendale-suite").removed;
    const stillNew = bendale?.newIds.filter((id) => !removedThere.includes(id));
    expect(stillNew).toContain("brimley-7");
  });

  it("creates a search's session from the empty one on first write", () => {
    const after = savedReducer(seed(), { type: "showNew", searchId: "woburn-main" });
    expect(searchSession(after, "woburn-main")).toEqual({
      ...EMPTY_SEARCH_SESSION,
      showNew: true,
    });
    expect(searchSession(after, "bendale-suite")).toBe(EMPTY_SEARCH_SESSION);
  });

  it("keeps the other searches' sessions by reference when one changes", () => {
    const first = savedReducer(seed(), {
      type: "dismissNew",
      searchId: "bendale-suite",
    });
    const second = savedReducer(first, {
      type: "remove",
      searchId: "woburn-main",
      listingId: "fenwood-9",
    });
    expect(second.perSearch["bendale-suite"]).toBe(first.perSearch["bendale-suite"]);
  });
});

describe("keep and wave are one decision with two answers", () => {
  const keep: SavedAction = {
    type: "keep",
    searchId: "bendale-suite",
    listingId: "ellesmere-40",
  };
  const wave: SavedAction = {
    type: "wave",
    searchId: "bendale-suite",
    listingId: "ellesmere-40",
  };

  it("keeps a home once, however many times she presses it", () => {
    const after = apply(seed(), keep, keep, keep);
    expect(searchSession(after, "bendale-suite").kept).toEqual(["ellesmere-40"]);
  });

  it("moves a waved home back when she keeps it after all", () => {
    const after = apply(seed(), wave, keep);
    const s = searchSession(after, "bendale-suite");
    expect(s.kept).toEqual(["ellesmere-40"]);
    expect(s.waved).toEqual([]);
  });

  it("takes a kept home out when she waves it off", () => {
    const after = apply(seed(), keep, wave);
    const s = searchSession(after, "bendale-suite");
    expect(s.waved).toEqual(["ellesmere-40"]);
    expect(s.kept).toEqual([]);
  });
});

describe("a reply is appended, dated as a phrase, and never invented", () => {
  const reply = (on: string, text: string): SavedAction => ({
    type: "reply",
    on,
    from: "nirosha",
    text,
  });

  it("appends a message dated Today with a session id", () => {
    const after = savedReducer(seed(), reply("ellendale-64", "I measured. Six foot six."));
    expect(after.replies["ellendale-64"]).toEqual([
      {
        id: "session-m0",
        from: "nirosha",
        when: "Today",
        text: "I measured. Six foot six.",
      },
    ]);
  });

  it("stamps a phrase WHEN_ORDER places, so the thread can still be sorted", () => {
    const after = savedReducer(seed(), reply("ellendale-64", "Fine."));
    const when = after.replies["ellendale-64"]?.[0]?.when ?? "";
    expect(WHEN_ORDER[when]).toBeDefined();
  });

  it("puts a second reply on the same home after the first", () => {
    const after = apply(seed(), reply("ellendale-64", "First."), reply("ellendale-64", "Second."));
    expect(after.replies["ellendale-64"]?.map((m) => m.id)).toEqual([
      "session-m0",
      "session-m1",
    ]);
    expect(after.replies["ellendale-64"]?.map((m) => m.text)).toEqual(["First.", "Second."]);
  });

  it("treats a collection id the same as a listing id", () => {
    const after = savedReducer(seed(), reply("amma-liked", "All three, she said."));
    expect(after.replies["amma-liked"]?.[0]?.text).toBe("All three, she said.");
  });

  it("trims what she typed", () => {
    const after = savedReducer(seed(), reply("ellendale-64", "  Fine.  "));
    expect(after.replies["ellendale-64"]?.[0]?.text).toBe("Fine.");
  });

  it("does nothing, and returns the same state, for blank text with no voice", () => {
    const before = seed();
    expect(savedReducer(before, reply("ellendale-64", "   "))).toBe(before);
    expect(savedReducer(before, reply("ellendale-64", ""))).toBe(before);
  });

  it("allows a voice note with no transcript", () => {
    // A note recorded this session has no transcript, and the panel says so.
    const after = savedReducer(seed(), {
      type: "reply",
      on: "ellendale-64",
      from: "amma",
      text: "",
      voice: VOICE,
    });
    expect(after.replies["ellendale-64"]).toHaveLength(1);
    expect(after.replies["ellendale-64"]?.[0]?.voice).toEqual(VOICE);
    expect(after.replies["ellendale-64"]?.[0]?.text).toBe("");
  });

  it("leaves other homes' threads by reference", () => {
    const first = savedReducer(seed(), reply("galloway-7", "Gone, then."));
    const second = savedReducer(first, reply("ellendale-64", "Saturday."));
    expect(second.replies["galloway-7"]).toBe(first.replies["galloway-7"]);
  });
});

describe("the panel is a window onto the state, not the state", () => {
  it("survives opening, closing and opening again", () => {
    const withReply = savedReducer(seed(), {
      type: "reply",
      on: "ellendale-64",
      from: "nirosha",
      text: "Saturday, then.",
    });
    const after = apply(
      withReply,
      { type: "open", panel: { kind: "home", id: "ellendale-64" } },
      { type: "close" },
      { type: "open", panel: { kind: "home", id: "ellendale-64" } },
    );
    expect(after.replies).toBe(withReply.replies);
    expect(after.panel).toEqual({ kind: "home", id: "ellendale-64" });
  });

  it("returns the same state when closing a panel that is not open", () => {
    const before = seed();
    expect(savedReducer(before, { type: "close" })).toBe(before);
  });
});

describe("ticks belong to the home they were made on", () => {
  const tick = (listingId: string): SavedAction => ({
    type: "tick",
    listingId,
    noteId: "ellendale-64-n0",
  });

  it("ticks a note on one home and not the same note id on another", () => {
    const after = savedReducer(seed(), tick("ellendale-64"));
    expect(after.ticked["ellendale-64"]).toEqual(["ellendale-64-n0"]);
    expect(after.ticked["bellamy-18"]).toBeUndefined();
  });

  it("unticks on the second press", () => {
    const after = apply(seed(), tick("ellendale-64"), tick("ellendale-64"));
    expect(after.ticked["ellendale-64"]).toEqual([]);
  });

  it("toggles a condition the same way, on its own record", () => {
    const tickIt: SavedAction = {
      type: "tickCondition",
      listingId: "ellendale-64",
      conditionId: "ellendale-64-c1",
    };
    expect(savedReducer(seed(), tickIt).conditionsDone["ellendale-64"]).toEqual([
      "ellendale-64-c1",
    ]);
    expect(apply(seed(), tickIt, tickIt).conditionsDone["ellendale-64"]).toEqual([]);
    expect(savedReducer(seed(), tickIt).ticked).toEqual({});
  });
});

describe("a home can sit in more than one box", () => {
  const into = (collectionId: string): SavedAction => ({
    type: "collect",
    collectionId,
    listingId: "pitfield-32",
  });
  const outOf = (collectionId: string): SavedAction => ({
    type: "uncollect",
    collectionId,
    listingId: "pitfield-32",
  });
  const homesIn = (s: SavedSession, id: string): readonly string[] | undefined =>
    s.collections.find((c) => c.id === id)?.homeIds;

  it("keeps the home in both after collecting into two", () => {
    const after = apply(seed(), into("appa-can-manage"), into("amma-liked"));
    expect(homesIn(after, "appa-can-manage")).toContain("pitfield-32");
    expect(homesIn(after, "amma-liked")).toContain("pitfield-32");
  });

  it("leaves the other box alone when she takes it out of one", () => {
    const after = apply(
      seed(),
      into("appa-can-manage"),
      into("amma-liked"),
      outOf("appa-can-manage"),
    );
    expect(homesIn(after, "appa-can-manage")).not.toContain("pitfield-32");
    expect(homesIn(after, "amma-liked")).toContain("pitfield-32");
  });

  it("does not add the same home twice, and says so by returning the same state", () => {
    const once = savedReducer(seed(), into("amma-liked"));
    const twice = savedReducer(once, into("amma-liked"));
    expect(twice).toBe(once);
    expect(homesIn(twice, "amma-liked")?.filter((id) => id === "pitfield-32")).toHaveLength(1);
  });

  it("rebuilds only the box that changed", () => {
    const before = seed();
    const after = savedReducer(before, into("appa-can-manage"));
    expect(after.collections[1]).toBe(before.collections[1]);
    expect(after.collections[0]).not.toBe(before.collections[0]);
    expect(before.collections[0]?.homeIds).not.toContain("pitfield-32");
  });

  it("ignores a box that does not exist", () => {
    const before = seed();
    expect(savedReducer(before, into("no-such-box"))).toBe(before);
    expect(savedReducer(before, outOf("no-such-box"))).toBe(before);
  });

  it("ignores taking out a home that was never in", () => {
    const before = seed();
    expect(savedReducer(before, outOf("amma-liked"))).toBe(before);
  });
});

describe("a new box is named, or it is not made", () => {
  it("returns the same state for a blank name", () => {
    const before = seed();
    const blank: SavedAction = { type: "newCollection", name: "   ", madeOn: "Today" };
    expect(savedReducer(before, blank)).toBe(before);
    expect(savedReducer(before, { ...blank, name: "" })).toBe(before);
  });

  it("appends the box, opens it, and moves her to collections", () => {
    const after = savedReducer(seed(), {
      type: "newCollection",
      name: "Near the hospital",
      because: "Appa's appointments are every Tuesday.",
      madeOn: "Today",
      firstListingId: "morningside-145",
    });
    const made = after.collections.at(-1);
    expect(after.collections).toHaveLength(SAVED_COLLECTIONS.length + 1);
    expect(made?.id).toBe("session-c0");
    expect(made?.name).toBe("Near the hospital");
    expect(made?.because).toBe("Appa's appointments are every Tuesday.");
    expect(made?.madeOn).toBe("Today");
    expect(made?.homeIds).toEqual(["morningside-145"]);
    expect(made?.sharedWith).toEqual([]);
    expect(made?.thread).toEqual([]);
    expect(after.openList.collections).toBe("session-c0");
    expect(after.section).toBe("collections");
  });

  it("gives the box no newIds, because a collection cannot grow on its own", () => {
    const after = savedReducer(seed(), {
      type: "newCollection",
      name: "Near the hospital",
      madeOn: "Today",
    });
    const made = after.collections.at(-1);
    expect(made).toBeDefined();
    expect(made && "newIds" in made).toBe(false);
  });

  it("starts empty when she made it without a home in hand", () => {
    const after = savedReducer(seed(), {
      type: "newCollection",
      name: "Later",
      madeOn: "Today",
    });
    expect(after.collections.at(-1)?.homeIds).toEqual([]);
  });

  it("trims the name and drops a blank reason", () => {
    const after = savedReducer(seed(), {
      type: "newCollection",
      name: "  Later  ",
      because: "   ",
      madeOn: "Today",
    });
    const made = after.collections.at(-1);
    expect(made?.name).toBe("Later");
    expect(made && "because" in made).toBe(false);
  });
});

describe("ids come from one counter", () => {
  it("increases seq across a reply, a note and a box, and the three ids differ", () => {
    const s0 = seed();
    const s1 = savedReducer(s0, {
      type: "reply",
      on: "ellendale-64",
      from: "nirosha",
      text: "One.",
    });
    const s2 = savedReducer(s1, { type: "addNote", listingId: "ellendale-64", what: "Two." });
    const s3 = savedReducer(s2, { type: "newCollection", name: "Three", madeOn: "Today" });
    expect([s0.seq, s1.seq, s2.seq, s3.seq]).toEqual([0, 1, 2, 3]);
    const ids = [
      s1.replies["ellendale-64"]?.[0]?.id,
      s2.added["ellendale-64"]?.[0]?.id,
      s3.collections.at(-1)?.id,
    ];
    expect(ids).toEqual(["session-m0", "session-n1", "session-c2"]);
    expect(new Set(ids).size).toBe(3);
  });

  it("does not spend a seq on a no-op", () => {
    const after = apply(
      seed(),
      { type: "reply", on: "ellendale-64", from: "nirosha", text: " " },
      { type: "addNote", listingId: "ellendale-64", what: "" },
      { type: "newCollection", name: " ", madeOn: "Today" },
    );
    expect(after.seq).toBe(0);
  });

  it("trims a note and keeps a blank one out", () => {
    const before = seed();
    expect(savedReducer(before, { type: "addNote", listingId: "ellendale-64", what: "  " })).toBe(before);
    const after = savedReducer(before, {
      type: "addNote",
      listingId: "ellendale-64",
      what: "  Bring the tape.  ",
    });
    expect(after.added["ellendale-64"]).toEqual([{ id: "session-n0", what: "Bring the tape." }]);
  });
});

describe("the stage is hers to set and hers to clear", () => {
  it("keeps the key with a null value when she clears it", () => {
    const after = apply(
      seed(),
      { type: "setStage", listingId: "ellendale-64", stage: "visited" },
      { type: "setStage", listingId: "ellendale-64", stage: null },
    );
    expect("ellendale-64" in after.stages).toBe(true);
    expect(after.stages["ellendale-64"]).toBeNull();
  });

  it("sets a stage on one home and not another", () => {
    const after = savedReducer(seed(), {
      type: "setStage",
      listingId: "pitfield-32",
      stage: "to-view",
    });
    expect(after.stages["pitfield-32"]).toBe("to-view");
    expect("ellendale-64" in after.stages).toBe(false);
  });
});

describe("the rail", () => {
  it("moves her to a section when she opens a list in it", () => {
    const after = savedReducer(seed(), {
      type: "openList",
      section: "searches",
      id: "woburn-main",
    });
    expect(after.section).toBe("searches");
    expect(after.openList.searches).toBe("woburn-main");
    expect(after.openList.library).toBe(seed().openList.library);
  });

  it("returns the same state when the section is already the one asked for", () => {
    const before = seed();
    expect(savedReducer(before, { type: "section", section: "library" })).toBe(before);
    expect(savedReducer(before, { type: "section", section: "searches" }).section).toBe("searches");
  });

  it("records her own home when she gives it, and lets her take it back", () => {
    const given = savedReducer(seed(), {
      type: "setSelling",
      selling: { address: "2205-88 Corporate Drive" },
    });
    expect(given.selling).toEqual({ address: "2205-88 Corporate Drive" });
    expect(savedReducer(given, { type: "setSelling", selling: null }).selling).toBeNull();
  });
});

describe("the reducer never mutates", () => {
  function deepFreeze<T>(value: T): T {
    if (value === null || typeof value !== "object") return value;
    Object.freeze(value);
    for (const key of Object.keys(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
    return value;
  }

  /** One of each. The mapped type makes a missing action type a compile error. */
  const EVERY: { [K in SavedAction["type"]]: Extract<SavedAction, { type: K }> } = {
    section: { type: "section", section: "searches" },
    openList: { type: "openList", section: "searches", id: "woburn-main" },
    open: { type: "open", panel: { kind: "collection", id: "amma-liked" } },
    close: { type: "close" },
    remove: { type: "remove", searchId: "cedarbrae-add", listingId: "brimley-7" },
    keep: { type: "keep", searchId: "bendale-suite", listingId: "ellesmere-40" },
    wave: { type: "wave", searchId: "bendale-suite", listingId: "brimley-7" },
    showNew: { type: "showNew", searchId: "bendale-suite" },
    dismissNew: { type: "dismissNew", searchId: "cedarbrae-add" },
    reply: { type: "reply", on: "ellendale-64", from: "rani", text: "A ramp is nothing." },
    tick: { type: "tick", listingId: "ellendale-64", noteId: "ellendale-64-n0" },
    addNote: { type: "addNote", listingId: "ellendale-64", what: "Check the rail." },
    tickCondition: {
      type: "tickCondition",
      listingId: "ellendale-64",
      conditionId: "ellendale-64-c0",
    },
    setStage: { type: "setStage", listingId: "pitfield-32", stage: "to-view" },
    filterStage: { type: "filterStage", stage: "visited" },
    setAgent: { type: "setAgent", listingId: "bellamy-18", on: true },
    forward: {
      type: "forward",
      listingId: "ellendale-64",
      messageId: "ellendale-64-m0",
      from: "amma",
      text: "The kitchen downstairs has a window.",
    },
    collect: { type: "collect", collectionId: "amma-liked", listingId: "pitfield-32" },
    uncollect: { type: "uncollect", collectionId: "amma-liked", listingId: "marcos-61" },
    newCollection: {
      type: "newCollection",
      name: "Near the hospital",
      madeOn: "Today",
      firstListingId: "morningside-145",
    },
    setSelling: { type: "setSelling", selling: { address: "2205-88 Corporate Drive" } },
    share: { type: "share", collectionId: "appa-can-manage", person: "rani" },
    unshare: { type: "unshare", collectionId: "appa-can-manage", person: "arun" },
  };

  it("runs every action type over a frozen state without throwing or changing it", () => {
    // Modules are strict, so a write to a frozen object throws rather than
    // failing quietly. The seed is frozen deep, fixture included.
    const frozen = deepFreeze(seed());
    for (const action of Object.values(EVERY)) {
      expect(() => savedReducer(frozen, action), action.type).not.toThrow();
      expect(frozen, action.type).toEqual(seed());
    }
  });

  it("runs every action type in sequence over a frozen state and still changes nothing behind it", () => {
    // Each step's output is frozen before the next reads it, so a later
    // action cannot lean on an earlier one having left something writable.
    let state = deepFreeze(seed());
    for (const action of Object.values(EVERY)) {
      const before = state;
      state = deepFreeze(savedReducer(before, action));
      expect(Object.isFrozen(before)).toBe(true);
    }
    expect(state.collections.at(-1)?.name).toBe("Near the hospital");
  });
});

describe("a box is shared by name, and never with the agent", () => {
  it("adds a person once, and rebuilds only the box that changed", () => {
    const before = seed();
    const other = before.collections[1];
    const once = savedReducer(before, {
      type: "share",
      collectionId: "appa-can-manage",
      person: "rani",
    });
    const twice = savedReducer(once, {
      type: "share",
      collectionId: "appa-can-manage",
      person: "rani",
    });
    expect(once.collections[0]?.sharedWith).toEqual(["arun", "rani"]);
    expect(twice).toBe(once);
    expect(once.collections[1]).toBe(other);
  });

  it("takes a person off, and is a no-op for someone who was never on", () => {
    const before = seed();
    const off = savedReducer(before, {
      type: "unshare",
      collectionId: "appa-can-manage",
      person: "arun",
    });
    expect(off.collections[0]?.sharedWith).toEqual([]);
    expect(
      savedReducer(off, {
        type: "unshare",
        collectionId: "appa-can-manage",
        person: "arun",
      }),
    ).toBe(off);
  });

  it("refuses to share with the agent, and says so by returning the same state", () => {
    // Sharing emails the people she names. Nothing here goes to an agent.
    const before = seed();
    expect(
      savedReducer(before, {
        type: "share",
        collectionId: "appa-can-manage",
        person: "anusha",
      }),
    ).toBe(before);
  });
});
