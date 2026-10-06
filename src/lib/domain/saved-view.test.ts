import { describe, expect, it } from "vitest";
import { SAVED } from "@/data/counts";
import {
  CAST,
  SAVED_COLLECTIONS,
  SAVED_HOMES,
  SAVED_SEARCHES,
  STAGES,
  savedHomeIds,
  type Collection,
  type HistoryKind,
  type PersonId,
  type SavedHome,
  type SavedSearch,
} from "@/data/saved";
import { spelled } from "./format";
import { savedReducer } from "./saved-reducer";
import {
  EMPTY_SEARCH_SESSION,
  LIBRARY_ID,
  initSession,
  type SavedSession,
} from "./saved-session";
import {
  alsoIn,
  collectionsFor,
  effectiveSearchHomeIds,
  headlineFor,
  latestFor,
  latestLine,
  libraryHomeIds,
  listById,
  listsFor,
  railRows,
  SECTION_TITLE,
  stageFor,
  stageLabel,
  stagePillsFor,
  tilesFor,
  WORLD,
  type SavedList,
  type SavedWorld,
} from "./saved-view";

/**
 * The rail, derived. Most of these hold one promise: that a list is a
 * function of the fixture and the session, and that touching one search
 * moves nothing in another.
 *
 * Nothing here pins a fact the fixture could change. A count is read off
 * `SAVED_HOMES` at run time, a name off `SAVED_SEARCHES`, and where a test
 * needs a week it can predict it builds the world by hand. The only exact
 * strings are sentences that are themselves the contract.
 */

const fresh = (): SavedSession =>
  initSession({
    collections: SAVED_COLLECTIONS,
    firstSearchId: "bendale-suite",
  });

/** The list with this id, or a failure that names it. */
function byId(lists: readonly SavedList[], id: string): SavedList {
  const list = lists.find((l) => l.id === id);
  if (!list) throw new Error(`no list "${id}" among ${lists.map((l) => l.id).join(", ")}`);
  return list;
}

function tileFor(listingId: string, session: SavedSession) {
  const library = byId(listsFor("library", WORLD, session), LIBRARY_ID);
  const tile = tilesFor(library, WORLD, session).find((t) => t.listing.id === listingId);
  if (!tile) throw new Error(`no tile for ${listingId}`);
  return tile;
}

/** The first of something the fixture must hold, or a failure that says what was wanted. */
function first<T>(items: readonly T[], what: string): T {
  const [item] = items;
  if (item === undefined) throw new Error(`the fixture has no ${what}`);
  return item;
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const homesWord = (n: number): string => (n === 1 ? "home" : "homes");
const searchesWord = (n: number): string => (n === 1 ? "search" : "searches");

/* ------------------------------------------------------------------ */
/* Worlds built by hand                                                */
/* ------------------------------------------------------------------ */

/** A record with one event per kind given, and nothing said about it. */
function homeWith(listingId: string, kinds: readonly HistoryKind[]): SavedHome {
  return {
    listingId,
    savedOn: "28 August",
    history: kinds.map((kind, i) => ({ id: `${listingId}-h${i}`, what: kind, when: "Last week", kind })),
    notes: [],
    thread: [],
    withAgent: [],
    papers: [],
  };
}

function searchOver(
  id: string,
  savedOn: string,
  homeIds: readonly string[],
  newIds: readonly string[] = [],
): SavedSearch {
  return { id, name: id, savedOn, homeIds, newIds, sharedWith: [], criteria: [] };
}

/** One search over homes the market has left alone: one only listed, one with no history at all. */
function quietWorld(): { world: SavedWorld; search: SavedSearch } {
  const search = searchOver("quiet", "28 August", ["quiet-1", "quiet-2"]);
  const homes = [homeWith("quiet-1", ["listed"]), homeWith("quiet-2", [])];
  return { world: { searches: [search], homes, listings: [] }, search };
}

describe("the library", () => {
  it("returns one list holding every saved home exactly once", () => {
    const lists = listsFor("library", WORLD, fresh());
    expect(lists).toHaveLength(1);
    const ids = byId(lists, LIBRARY_ID).homeIds;
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...savedHomeIds()].sort());
  });

  it("counts 7 Brimley once, though Cedarbrae saved it and Bendale found it again", () => {
    // It is in Cedarbrae's homeIds and Bendale's newIds. Found is not saved.
    const ids = byId(listsFor("library", WORLD, fresh()), LIBRARY_ID).homeIds;
    expect(ids.filter((id) => id === "brimley-7")).toHaveLength(1);
  });

  it("is the number the rail prints as saved", () => {
    expect(libraryHomeIds(WORLD, fresh())).toHaveLength(SAVED.total);
  });

  it("grows by one when she keeps a new match, and puts it first in its search", () => {
    const session = savedReducer(fresh(), {
      type: "keep",
      searchId: "bendale-suite",
      listingId: "ellesmere-40",
    });
    expect(libraryHomeIds(WORLD, session)).toHaveLength(SAVED.total + 1);
    const bendale = byId(listsFor("searches", WORLD, session), "bendale-suite");
    expect(bendale.homeIds[0]).toBe("ellesmere-40");
  });
});

describe("removing a home from one search", () => {
  // The regression. Three lists of ids with no search on them made this
  // remove 7 Brimley from Bendale's new matches as well.
  const session = savedReducer(fresh(), {
    type: "remove",
    searchId: "cedarbrae-add",
    listingId: "brimley-7",
  });

  it("returns three searches", () => {
    expect(listsFor("searches", WORLD, session)).toHaveLength(SAVED.searches);
  });

  it("drops it from that search and leaves it new in the other", () => {
    const lists = listsFor("searches", WORLD, session);
    expect(byId(lists, "cedarbrae-add").homeIds).not.toContain("brimley-7");
    expect(byId(lists, "bendale-suite").newIds).toContain("brimley-7");
  });

  it("drops it from the library when no other search still holds it", () => {
    expect(libraryHomeIds(WORLD, session)).not.toContain("brimley-7");
  });

  it("does not dedupe away a removal that was written by hand", () => {
    // Same state, built without the reducer, so the view is tested on its own.
    const byHand: SavedSession = {
      ...fresh(),
      perSearch: { "cedarbrae-add": { ...EMPTY_SEARCH_SESSION, removed: ["brimley-7"] } },
    };
    const cedarbrae = WORLD.searches.find((s) => s.id === "cedarbrae-add");
    expect(cedarbrae).toBeDefined();
    expect(effectiveSearchHomeIds(cedarbrae!, byHand)).toEqual(
      cedarbrae!.homeIds.filter((id) => id !== "brimley-7"),
    );
  });
});

describe("collections", () => {
  it("never have new matches, whether the fixture made them or she did", () => {
    const made = savedReducer(fresh(), {
      type: "newCollection",
      name: "Near the hospital",
      madeOn: "Today",
      firstListingId: "ellendale-64",
    });
    const lists = listsFor("collections", WORLD, made);
    expect(lists).toHaveLength(SAVED.collections + 1);
    for (const list of lists) expect(list.newIds).toEqual([]);
  });

  it("say who they are shared with, by name, or that they are not", () => {
    const box = (id: string, sharedWith: readonly PersonId[]): Collection => ({
      id,
      name: id,
      madeOn: "Today",
      homeIds: [],
      sharedWith,
      thread: [],
    });
    const session = {
      ...fresh(),
      collections: [
        box("c-one", ["arun"]),
        box("c-two", ["amma", "rani"]),
        box("c-three", ["amma", "appa", "rani"]),
        box("c-mine", []),
      ],
    };
    const lists = listsFor("collections", WORLD, session);
    expect(byId(lists, "c-one").meta).toBe(`Shared with ${CAST.arun.name}`);
    expect(byId(lists, "c-two").meta).toBe(`Shared with ${CAST.amma.name} and ${CAST.rani.name}`);
    expect(byId(lists, "c-three").meta).toBe(
      `Shared with ${CAST.amma.name}, ${CAST.appa.name} and ${CAST.rani.name}`,
    );
    expect(byId(lists, "c-mine").meta).toBe("Not shared");
  });

  it("only show what is still saved", () => {
    // A home a box holds that only one search saved. Take it out there and
    // the box lets go of it without being told.
    const pair = SAVED_COLLECTIONS.flatMap((collection) =>
      collection.homeIds.map((id) => ({
        collection,
        id,
        holders: SAVED_SEARCHES.filter((s) => s.homeIds.includes(id)),
      })),
    ).find((p) => p.holders.length === 1);
    if (!pair) throw new Error("no collection home is held by exactly one search");
    const only = first(pair.holders, "search holding the home");

    const session = savedReducer(fresh(), {
      type: "remove",
      searchId: only.id,
      listingId: pair.id,
    });
    const box = byId(listsFor("collections", WORLD, session), pair.collection.id);
    expect(box.homeIds).not.toContain(pair.id);
    expect(box.homeIds).toEqual(pair.collection.homeIds.filter((id) => id !== pair.id));
  });
});

describe("the stage pills", () => {
  it("open on All, then the stages in purchase order", () => {
    const library = byId(listsFor("library", WORLD, fresh()), LIBRARY_ID);
    const pills = stagePillsFor(library, WORLD, fresh());
    expect(pills[0]?.stage).toBeNull();
    expect(pills[0]?.label).toBe("All");
    expect(pills.slice(1).map((p) => p.stage)).toEqual([...STAGES]);
    expect(pills.slice(1).map((p) => p.label)).toEqual(STAGES.map(stageLabel));
  });

  it("counts All as the whole list, and every stage inside it", () => {
    const library = byId(listsFor("library", WORLD, fresh()), LIBRARY_ID);
    const pills = stagePillsFor(library, WORLD, fresh());
    expect(pills[0]?.count).toBe(library.homeIds.length);
    for (const stage of STAGES) {
      const staged = SAVED_HOMES.filter(
        (h) => h.stage === stage && library.homeIds.includes(h.listingId),
      ).length;
      expect(pills.find((p) => p.stage === stage)?.count, stage).toBe(staged);
    }
  });

  it("counts inside the box that is open, not across the library", () => {
    // This is what the pills bought that the old rail section could not:
    // "the ones I have seen, inside Ones Appa can manage" is a question with
    // an answer now.
    const box = first(SAVED_COLLECTIONS, "collection");
    const list = byId(listsFor("collections", WORLD, fresh()), box.id);
    const pills = stagePillsFor(list, WORLD, fresh());
    expect(pills[0]?.count).toBe(list.homeIds.length);
    for (const pill of pills.slice(1)) {
      expect(pill.count, `${box.id}/${pill.label}`).toBeLessThanOrEqual(
        list.homeIds.length,
      );
    }
  });

  it("draws an empty stage rather than leaving it out", () => {
    const box = byId(listsFor("collections", WORLD, fresh()), "amma-liked");
    const pills = stagePillsFor(box, WORLD, fresh());
    expect(pills).toHaveLength(STAGES.length + 1);
  });

  it("filters the grid to one stage, and back to all of them", () => {
    const library = byId(listsFor("library", WORLD, fresh()), LIBRARY_ID);
    const staged = first(
      SAVED_HOMES.filter((h) => h.stage !== undefined),
      "staged home",
    );
    const stage = staged.stage!;
    const filtered = savedReducer(fresh(), { type: "filterStage", stage });
    const tiles = tilesFor(library, WORLD, filtered);
    expect(tiles.length).toBeGreaterThan(0);
    for (const tile of tiles) expect(tile.stage).toBe(stage);

    const all = savedReducer(filtered, { type: "filterStage", stage: null });
    expect(tilesFor(library, WORLD, all).length).toBe(library.homeIds.length);
  });

  it("goes back to all of them when she opens another list", () => {
    // A filter counted against one list, carried into another, is an empty
    // grid for a reason nothing on screen explains.
    const filtered = savedReducer(fresh(), {
      type: "filterStage",
      stage: "visited",
    });
    expect(filtered.stageFilter).toBe("visited");
    const moved = savedReducer(filtered, {
      type: "openList",
      section: "collections",
      id: "amma-liked",
    });
    expect(moved.stageFilter).toBeNull();
  });

  it("is read by stageFor, which honours a session null as cleared", () => {
    const staged = first(SAVED_HOMES.filter((h) => h.stage !== undefined), "staged home");
    const cleared: SavedSession = { ...fresh(), stages: { [staged.listingId]: null } };
    expect(stageFor(staged, cleared)).toBeUndefined();
    // And a home she never touched keeps the fixture's stage.
    expect(stageFor(staged, fresh())).toBe(staged.stage);
  });
});

describe("searches", () => {
  it("carry the day they were saved, and nothing the row already counts", () => {
    // The meta used to repeat the count and say "shared" beside a row that
    // already had a number on it and faces above it.
    const lists = listsFor("searches", WORLD, fresh());
    for (const search of SAVED_SEARCHES) {
      const list = byId(lists, search.id);
      expect(list.meta, search.id).toBe(`Saved ${search.savedOn}`);
    }

    // The count is on the rail row, not in this line, and it follows the
    // list: take one out and the row's number drops while the meta holds.
    const search = first(SAVED_SEARCHES, "search");
    const gone = first(search.homeIds, "home in the first search");
    const session = savedReducer(fresh(), { type: "remove", searchId: search.id, listingId: gone });
    const after = byId(listsFor("searches", WORLD, session), search.id);
    expect(after.homeIds.length).toBe(search.homeIds.length - 1);
    expect(after.meta).toBe(`Saved ${search.savedOn}`);
  });

  it("stop calling a match new once she has kept it or waved it off", () => {
    const before = listsFor("searches", WORLD, fresh());
    const bendale = byId(before, "bendale-suite");
    // Keep the first and wave the rest, so both answers are exercised.
    let session = fresh();
    bendale.newIds.forEach((listingId, i) => {
      session = savedReducer(
        session,
        i === 0
          ? { type: "keep", searchId: bendale.id, listingId }
          : { type: "wave", searchId: bendale.id, listingId },
      );
    });
    const after = listsFor("searches", WORLD, session);
    expect(byId(after, bendale.id).newIds).toEqual([]);
    // The other searches were not asked, even where they found the same home.
    for (const list of before) {
      if (list.id === bendale.id) continue;
      expect(byId(after, list.id).newIds, list.id).toEqual(list.newIds);
    }
  });

  it("are found by id, and an unknown id is undefined rather than a blank list", () => {
    const search = first(SAVED_SEARCHES, "search");
    expect(listById("searches", search.id, WORLD, fresh())?.name).toBe(search.name);
    expect(listById("searches", "nowhere", WORLD, fresh())).toBeUndefined();
  });
});

describe("the headline", () => {
  it("says what happened to Bendale, counted from kind, in the words the design used", () => {
    // Bendale's week, built by hand so the sentence is knowable: two new, one
    // sold, one cut. The sold home has three events and still counts once.
    const bendale = searchOver("bendale", "12 August", ["sold-1", "cut-1", "quiet-1"], ["new-1", "new-2"]);
    const world: SavedWorld = {
      searches: [bendale],
      homes: [
        homeWith("sold-1", ["listed", "offer", "sold"]),
        homeWith("cut-1", ["listed", "price"]),
        homeWith("quiet-1", ["listed"]),
      ],
      listings: [],
    };
    const list = byId(listsFor("searches", world, fresh()), bendale.id);
    expect(headlineFor(list, world, fresh())).toBe(
      "Saved on 12 August. Two new since Tuesday, one sold, one cut its price.",
    );
  });

  it("does not tell Woburn about Bendale's week", () => {
    const bendale = searchOver("bendale", "12 August", ["quiet-1"], ["new-1", "new-2"]);
    const woburn = searchOver("woburn", "28 August", ["quiet-2"]);
    const world: SavedWorld = {
      searches: [bendale, woburn],
      homes: [homeWith("quiet-1", ["listed"]), homeWith("quiet-2", [])],
      listings: [],
    };
    const lists = listsFor("searches", world, fresh());
    expect(headlineFor(byId(lists, bendale.id), world, fresh())).toContain("Two new since Tuesday");
    const line = headlineFor(byId(lists, woburn.id), world, fresh());
    expect(line).not.toContain("new");
    expect(line).not.toContain("since Tuesday");
  });

  it("says nothing has changed when nothing has, and never pleads insufficient data", () => {
    const { world, search } = quietWorld();
    const list = byId(listsFor("searches", world, fresh()), search.id);
    const line = headlineFor(list, world, fresh());
    expect(line).toBe(`Saved on ${search.savedOn}. Nothing has changed since you saved it.`);
    expect(line).not.toContain("Insufficient data");
  });

  it("opens the library with the count across searches, as a word", () => {
    const library = byId(listsFor("library", WORLD, fresh()), LIBRARY_ID);
    const line = headlineFor(library, WORLD, fresh());
    const n = savedHomeIds().length;
    const searches = SAVED_SEARCHES.length;
    const opening = `${cap(spelled(n))} across ${spelled(searches)} ${searchesWord(searches)}.`;
    expect(line.startsWith(`${opening} `)).toBe(true);

    // The rest counts homes by kind, never events or words.
    const homes = SAVED_HOMES.filter((h) => library.homeIds.includes(h.listingId));
    const sold = homes.filter((h) => h.history.some((e) => e.kind === "sold")).length;
    const cuts = homes.filter((h) => h.history.some((e) => e.kind === "price")).length;
    const clauses: string[] = [];
    if (sold > 0) clauses.push(`${spelled(sold)} sold`);
    if (cuts > 0) clauses.push(`${spelled(cuts)} cut ${cuts === 1 ? "its price" : "their prices"}`);
    const changes =
      clauses.length === 0
        ? "Nothing has changed since you saved it."
        : `${cap(clauses.join(", "))}.`;
    expect(line).toBe(`${opening} ${changes}`);
  });

  it("uses her reason for a box when she gave one, and its shape when she did not", () => {
    const lists = listsFor("collections", WORLD, fresh());
    for (const c of SAVED_COLLECTIONS) {
      if (c.because) expect(headlineFor(byId(lists, c.id), WORLD, fresh()), c.id).toBe(c.because);
    }

    const why: Collection = {
      id: "c-why",
      name: "Near the hospital",
      because: "Ten minutes to the General, on a bad day.",
      madeOn: "Today",
      homeIds: ["ellendale-64"],
      sharedWith: [],
      thread: [],
    };
    const plain: Collection = {
      id: "c-plain",
      name: "Both sides of Lawrence",
      madeOn: "Today",
      homeIds: ["ellendale-64", "marcos-61"],
      sharedWith: [],
      thread: [],
    };
    const session = { ...fresh(), collections: [why, plain] };
    const made = listsFor("collections", WORLD, session);
    expect(headlineFor(byId(made, why.id), WORLD, session)).toBe(why.because);

    // No reason given, so the shape: how many, drawn from how many searches.
    const shape = byId(made, plain.id);
    const n = shape.homeIds.length;
    const from = SAVED_SEARCHES.filter((s) => shape.homeIds.some((id) => s.homeIds.includes(id))).length;
    expect(headlineFor(shape, WORLD, session)).toBe(
      `${cap(spelled(n))} ${homesWord(n)}, from ${spelled(from)} ${searchesWord(from)}. Nothing arrives here on its own.`,
    );
  });

  it("does not count a session reply as something the market did", () => {
    const { world, search } = quietWorld();
    const before = headlineFor(byId(listsFor("searches", world, fresh()), search.id), world, fresh());
    const session = savedReducer(fresh(), {
      type: "reply",
      on: "quiet-1",
      from: "anusha",
      text: "Sold, over asking.",
    });
    expect(session.replies["quiet-1"]).toHaveLength(1);
    // The words say sold. The kind is what counts, and a reply has none.
    const after = headlineFor(byId(listsFor("searches", world, session), search.id), world, session);
    expect(after).toBe(before);
    expect(after).toBe(`Saved on ${search.savedOn}. Nothing has changed since you saved it.`);
  });
});

describe("tiles", () => {
  it("never mark a home with a fixture record as just saved", () => {
    const library = byId(listsFor("library", WORLD, fresh()), LIBRARY_ID);
    const recorded = new Set(SAVED_HOMES.map((h) => h.listingId));
    for (const tile of tilesFor(library, WORLD, fresh())) {
      if (recorded.has(tile.listing.id)) expect(tile.justSaved, tile.listing.id).toBe(false);
    }
  });

  it("mark a kept new match as just saved, with nothing in its history", () => {
    const session = savedReducer(fresh(), {
      type: "keep",
      searchId: "bendale-suite",
      listingId: "ellesmere-40",
    });
    const tile = tileFor("ellesmere-40", session);
    expect(tile.justSaved).toBe(true);
    expect(tile.home.history).toEqual([]);
    expect(tile.home.savedOn).toBe("Today");
    expect(tile.stage).toBeUndefined();
  });

  it("carry the newest thing on the house as their last line", () => {
    // Ellendale's newest is the agent answering today, not Tuesday's offer.
    const tile = tileFor("ellendale-64", fresh());
    expect(tile.latest?.who).toBe("anusha");
    expect(tile.latest?.when).toBe("Today");
    expect(latestLine(tile.latest)).toBe(
      `${CAST.anusha.name} · a rail bolts to brick · Today`,
    );
  });

  it("say what is missing on a house nothing has happened to", () => {
    const tile = tileFor("pitfield-32", fresh());
    expect(tile.home.history).toEqual([]);
    expect(tile.latest).toBeNull();
    expect(latestLine(tile.latest)).toBe("Not viewed, nothing said");
  });

  it("give the market the day when it lands on the same one as a message", () => {
    // 7 Galloway sold on Monday and Amma said something about it on Monday.
    // A sale is a fact about the house; a message is a fact about a person.
    const tile = tileFor("galloway-7", fresh());
    expect(tile.latest?.who).toBeUndefined();
    expect(tile.latest?.what).toContain("Sold");
  });

  it("move to what she just wrote, on a house where nothing is newer", () => {
    const before = tileFor("bellamy-18", fresh());
    expect(before.latest?.when).not.toBe("Today");
    const session = savedReducer(fresh(), {
      type: "reply",
      on: "bellamy-18",
      from: "rani",
      text: "Go on Saturday.",
    });
    const after = tileFor("bellamy-18", session);
    expect(after.latest?.who).toBe("rani");
    expect(after.latest?.when).toBe("Today");
    expect(after.latest?.what).toBe("left a note");
  });

  it("say what a person did, where they left no gist", () => {
    // A gist is three or four words somebody wrote for the tile. Without one
    // the line says what the message was, which is true of every message.
    const spoken = SAVED_HOMES.flatMap((h) => h.thread).find(
      (m) => m.voice !== undefined && m.gist === undefined,
    );
    expect(spoken, "the fixture has a voice note with no gist").toBeDefined();
    const home: SavedHome = {
      listingId: "made-up",
      savedOn: "Today",
      history: [],
      notes: [],
      thread: [spoken!],
      withAgent: [],
      papers: [],
    };
    expect(latestFor(home, fresh())?.what).toBe("left a voice note");
  });

  it("never say new, on any home", () => {
    // There is no last-visit timestamp in this product. A line that implied
    // one would be the unread badge the docs rule out, wearing a sentence.
    const library = byId(listsFor("library", WORLD, fresh()), LIBRARY_ID);
    for (const tile of tilesFor(library, WORLD, fresh())) {
      expect(latestLine(tile.latest).toLowerCase(), tile.listing.id).not.toContain(
        "new",
      );
    }
  });

  it("know which boxes hold the home", () => {
    const library = byId(listsFor("library", WORLD, fresh()), LIBRARY_ID);
    for (const tile of tilesFor(library, WORLD, fresh())) {
      const boxes = SAVED_COLLECTIONS.filter((c) => c.homeIds.includes(tile.listing.id));
      expect(tile.collections.map((c) => c.id).sort(), tile.listing.id).toEqual(
        boxes.map((c) => c.id).sort(),
      );
    }
    expect(collectionsFor("nowhere-0", SAVED_COLLECTIONS)).toEqual([]);
  });

  it("skip a home that has no card rather than drawing a blank one", () => {
    const world = { ...WORLD, listings: WORLD.listings.filter((l) => l.id !== "pitfield-32") };
    const library = byId(listsFor("library", world, fresh()), LIBRARY_ID);
    const ids = tilesFor(library, world, fresh()).map((t) => t.listing.id);
    expect(ids).not.toContain("pitfield-32");
    expect(ids).toHaveLength(library.homeIds.length - 1);
  });
});

describe("alsoIn", () => {
  it("tells a Bendale new-match row that Cedarbrae already saved 7 Brimley", () => {
    const also = alsoIn("brimley-7", WORLD, fresh(), "bendale-suite").map((l) => l.id);
    const holders = SAVED_SEARCHES.filter(
      (s) => s.id !== "bendale-suite" && s.homeIds.includes("brimley-7"),
    ).map((s) => s.id);
    expect(also.filter((id) => SAVED_SEARCHES.some((s) => s.id === id)).sort()).toEqual(
      holders.sort(),
    );
    expect(also).not.toContain("bendale-suite");
  });

  it("excludes the list she is looking at, and lists boxes as well as searches", () => {
    // A saved home that sits in a box, looked at from a search that holds it.
    const listingId = first(
      savedHomeIds().filter((id) => SAVED_COLLECTIONS.some((c) => c.homeIds.includes(id))),
      "saved home in a box",
    );
    const except = first(SAVED_SEARCHES.filter((s) => s.homeIds.includes(listingId)), "search holding it");
    const also = alsoIn(listingId, WORLD, fresh(), except.id).map((l) => l.id);
    const expected = [...SAVED_SEARCHES, ...SAVED_COLLECTIONS]
      .filter((l) => l.id !== except.id && l.homeIds.includes(listingId))
      .map((l) => l.id);
    expect([...also].sort()).toEqual(expected.sort());
    expect(also).not.toContain(except.id);
    expect(also.some((id) => SAVED_COLLECTIONS.some((c) => c.id === id))).toBe(true);
  });
});

describe("the rail", () => {
  it("is one flat list: the library, then the boxes, then the searches", () => {
    const rows = railRows(WORLD, fresh());
    expect(rows.map((r) => r.section)).toEqual([
      "library",
      ...SAVED_COLLECTIONS.map(() => "collections" as const),
      ...SAVED_SEARCHES.map(() => "searches" as const),
    ]);
  });

  it("holds every list exactly once, and no stage among them", () => {
    const rows = railRows(WORLD, fresh());
    const ids = rows.map((r) => `${r.section}/${r.id}`);
    expect(new Set(ids).size).toBe(ids.length);
    for (const stage of STAGES) {
      expect(rows.some((r) => r.id === stage)).toBe(false);
    }
  });

  it("names each kind of list where a group needs a name", () => {
    for (const section of ["library", "collections", "searches"] as const) {
      expect(SECTION_TITLE[section].length).toBeGreaterThan(0);
    }
  });

  it("labels every stage in two words or fewer", () => {
    for (const stage of STAGES) {
      expect(stageLabel(stage).split(" ").length).toBeLessThanOrEqual(2);
    }
  });
});
