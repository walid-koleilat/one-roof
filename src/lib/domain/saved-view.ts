import { LISTINGS, type Listing } from "@/data/listings";
import {
  CAST,
  SAVED_HOMES,
  SAVED_SEARCHES,
  STAGES,
  WHEN_ORDER,
  type Collection,
  type HistoryKind,
  type Message,
  type PersonId,
  type SavedHome,
  type SavedSearch,
  type Stage,
} from "@/data/saved";
import { agentKey, LIBRARY_ID, searchSession, type RailSection, type SavedSession } from "./saved-session";
import { spelled } from "./format";

/**
 * What each list holds, worked out rather than remembered.
 *
 * The saved page used to know these things by heart. The rail said eleven
 * because a component said eleven. The line under a search's name read "Two
 * new since Tuesday, one sold, one cut its price" because somebody typed it,
 * and it went on saying so when she opened Woburn, where nothing had been
 * sold and nothing was new. A page that recites its own state cannot be
 * wrong in a way a test can see; it can only be wrong in a way a reader can.
 *
 * So every list, every count and every headline is a function of two inputs
 * and nothing else: what the fixture declares, and what she did this
 * session. Remove 7 Brimley from Cedarbrae and the library shrinks by one
 * and the box it sat in loses it, from the same call, because neither kept
 * a copy.
 *
 * Two rules from the rest of the repo hold throughout. Nothing is read out
 * of prose: a sale is a history event whose `kind` is "sold", never a `what`
 * that contains the word, and a date is a phrase the fixture placed, never
 * one guessed from a sentence. And nothing here knows when she last looked,
 * so there is no unread count anywhere.
 */

/* ------------------------------------------------------------------ */
/* The world                                                           */
/* ------------------------------------------------------------------ */

/**
 * Everything the page reads that she did not do this session.
 *
 * Passed in rather than imported inside each function so a test can hand
 * over a world with a home missing and see the view cope, instead of editing
 * the fixture to find out.
 */
export interface SavedWorld {
  searches: readonly SavedSearch[];
  homes: readonly SavedHome[];
  listings: readonly Listing[];
}

export const WORLD: SavedWorld = {
  searches: SAVED_SEARCHES,
  homes: SAVED_HOMES,
  listings: LISTINGS,
};

/* ------------------------------------------------------------------ */
/* Words                                                               */
/* ------------------------------------------------------------------ */

/**
 * What each kind of list is called where a group needs a name - the phone's
 * chip row, a screen reader's landmark.
 *
 * The rail itself prints no headings. It used to print four, each with a
 * sentence under it explaining what kind of container it was, and the
 * explanation was the tell: a rail that has to describe itself is a rail
 * with too many kinds of thing in it.
 */
export const SECTION_TITLE: Record<RailSection, string> = {
  library: "Saved",
  collections: "Collections",
  searches: "Searches",
};

const STAGE_LABEL: Record<Stage, string> = {
  "to-view": "To view",
  visited: "Visited",
  "offer-in": "Offer in",
  closing: "Closing",
  gone: "Gone",
};

export function stageLabel(stage: Stage): string {
  return STAGE_LABEL[stage];
}

/**
 * Where she has got to with a home, honouring anything she set this session.
 *
 * A key in `session.stages` wins outright, and a `null` there means she
 * cleared the fixture's stage rather than never touched it. `saved-week.ts`
 * applies the same rule privately; the two must not drift.
 */
export function stageFor(
  home: SavedHome,
  session: SavedSession,
): Stage | undefined {
  if (Object.hasOwn(session.stages, home.listingId)) {
    return session.stages[home.listingId] ?? undefined;
  }
  return home.stage;
}

/* ------------------------------------------------------------------ */
/* Lists                                                               */
/* ------------------------------------------------------------------ */

export interface SavedList {
  section: RailSection;
  id: string;
  name: string;
  /** The line under the name where one is drawn. Computed, may be "". */
  meta: string;
  homeIds: readonly string[];
  /** Empty for everything except a search. A collection has no way to grow. */
  newIds: readonly string[];
  sharedWith: readonly PersonId[];
  criteria: readonly string[];
}

/** Each id once, in the order it was first seen. */
function dedupe(ids: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * What one search holds now: the new matches she kept, first, because she
 * just chose them; then what the fixture says she saved; minus anything she
 * took out. Reading `session.perSearch` by this search's id is the fix for
 * a removal in one search reaching into another.
 */
export function effectiveSearchHomeIds(
  search: SavedSearch,
  session: SavedSession,
): readonly string[] {
  const s = searchSession(session, search.id);
  const kept = new Set(s.kept);
  const removed = new Set(s.removed);
  return dedupe(
    [...search.newIds.filter((id) => kept.has(id)), ...search.homeIds].filter(
      (id) => !removed.has(id),
    ),
  );
}

/**
 * Every home she has saved, across every search, counted once. This is what
 * the library shows, and its length is what "11 saved" means.
 */
export function libraryHomeIds(
  world: SavedWorld,
  session: SavedSession,
): readonly string[] {
  return dedupe(
    world.searches.flatMap((s) => effectiveSearchHomeIds(s, session)),
  );
}

function homeRecord(id: string, world: SavedWorld): SavedHome | undefined {
  return world.homes.find((h) => h.listingId === id);
}

/**
 * A home she kept off a new match this session. Nothing has happened to it
 * since, and its record says so rather than borrowing another home's.
 * "Today" is a phrase `WHEN_ORDER` places, not a clock read.
 */
function justSavedHome(id: string): SavedHome {
  return {
    listingId: id,
    savedOn: "Today",
    history: [],
    notes: [],
    thread: [],
    withAgent: [],
    papers: [],
  };
}

export function homeFor(id: string, world: SavedWorld): SavedHome {
  return homeRecord(id, world) ?? justSavedHome(id);
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** "Arun", "Amma and Rani", "Amma, Arun and Rani". */
export function names(people: readonly PersonId[]): string {
  const list = people.map((p) => CAST[p].name);
  if (list.length <= 1) return list.join("");
  return `${list.slice(0, -1).join(", ")} and ${list.slice(-1).join("")}`;
}

function sharingMeta(people: readonly PersonId[]): string {
  return people.length === 0 ? "Not shared" : `Shared with ${names(people)}`;
}

export function listsFor(
  section: RailSection,
  world: SavedWorld,
  session: SavedSession,
): readonly SavedList[] {
  const library = libraryHomeIds(world, session);
  switch (section) {
    case "library":
      return [
        {
          section,
          id: LIBRARY_ID,
          name: "Every home you saved",
          meta: "",
          homeIds: library,
          newIds: [],
          sharedWith: [],
          criteria: [],
        },
      ];

    case "collections": {
      // A collection only shows what is still saved. Take a home out of its
      // last search and the collection lets go of it too, without being told.
      const saved = new Set(library);
      return session.collections.map((c) => ({
        section,
        id: c.id,
        name: c.name,
        meta: sharingMeta(c.sharedWith),
        homeIds: c.homeIds.filter((id) => saved.has(id)),
        newIds: [],
        sharedWith: c.sharedWith,
        criteria: [],
      }));
    }

    case "searches":
      return world.searches.map((search) => {
        const s = searchSession(session, search.id);
        const answered = new Set([...s.kept, ...s.waved]);
        const homeIds = effectiveSearchHomeIds(search, session);
        return {
          section,
          id: search.id,
          name: search.name,
          meta: `Saved ${search.savedOn}`,
          homeIds,
          // A new match she kept is saved now; one she waved off is gone.
          // Either way it has stopped being new.
          newIds: search.newIds.filter((id) => !answered.has(id)),
          sharedWith: search.sharedWith,
          criteria: search.criteria,
        };
      });
  }
}

/**
 * The rail, in one flat list, in the order it is drawn: the library, then
 * her collections, then her searches.
 *
 * One list rather than three sections with headings. Everything in it is
 * the same gesture - press it and the grid below changes - and three
 * headings over three kinds of the same gesture was the page explaining its
 * own filing system before showing her a house.
 */
export function railRows(
  world: SavedWorld,
  session: SavedSession,
): readonly SavedList[] {
  return [
    ...listsFor("library", world, session),
    ...listsFor("collections", world, session),
    ...listsFor("searches", world, session),
  ];
}

export function listById(
  section: RailSection,
  id: string,
  world: SavedWorld,
  session: SavedSession,
): SavedList | undefined {
  return listsFor(section, world, session).find((l) => l.id === id);
}

/* ------------------------------------------------------------------ */
/* The stage pills                                                     */
/* ------------------------------------------------------------------ */

export interface StagePill {
  /** Null is the first pill: all of them. */
  stage: Stage | null;
  label: string;
  count: number;
}

/**
 * The pill row over the grid, counted inside whichever list is open.
 *
 * This is what replaced a section of the rail. The counts are the point: an
 * empty stage is drawn with a zero rather than left out, so the row has the
 * same shape on every list and "nothing is closing in this box" is a fact
 * she can read instead of an absence she has to notice.
 */
export function stagePillsFor(
  list: SavedList,
  world: SavedWorld,
  session: SavedSession,
): readonly StagePill[] {
  const staged = list.homeIds.map((id) => stageFor(homeFor(id, world), session));
  return [
    { stage: null, label: "All", count: list.homeIds.length },
    ...STAGES.map((stage) => ({
      stage,
      label: stageLabel(stage),
      count: staged.filter((s) => s === stage).length,
    })),
  ];
}

/* ------------------------------------------------------------------ */
/* The latest thing on a house                                         */
/* ------------------------------------------------------------------ */

/**
 * The last line of a tile: the newest thing that happened to this house.
 *
 * It is the one element on a tile that is not on the listing itself, and it
 * is why the grid is worth coming back to - eleven houses, and each one says
 * what changed on it since she last looked at it. Never "new": nothing here
 * knows when she last looked, and a line that claims to would be the unread
 * badge the docs rule out, wearing a sentence.
 *
 * Three candidates, and the newest phrase wins. Where two land on the same
 * day the market goes first, because a history event is a fact about the
 * house and a message is a fact about a person; then the agent's lane, then
 * the family's.
 */
export interface Latest {
  /** Who, when a person did it. Absent for a market event. */
  who?: PersonId;
  /** The words: a history event's own, or a short gist, or what they did. */
  what: string;
  when: string;
}

/** What a message with no gist of its own says it was. */
function actOf(message: Message): string {
  if (message.forwarded) return `sent to ${CAST.anusha.name}`;
  if (message.voice) return "left a voice note";
  if (CAST[message.from].tone === "agent") return "answered";
  return "left a note";
}

function fromMessage(message: Message | undefined): Latest | null {
  if (!message) return null;
  return {
    who: message.from,
    what: message.gist ?? actOf(message),
    when: message.when,
  };
}

/** Where a phrase sits in her week. An unplaced phrase sorts oldest. */
function placed(when: string): number {
  return WHEN_ORDER[when] ?? Number.NEGATIVE_INFINITY;
}

function lastOf(messages: readonly Message[]): Message | undefined {
  return messages[messages.length - 1];
}

export function latestFor(
  home: SavedHome,
  session: SavedSession,
): Latest | null {
  const id = home.listingId;
  const history = home.history[0];
  const agentLane = [...home.withAgent, ...(session.replies[agentKey(id)] ?? [])];
  const family = [...home.thread, ...(session.replies[id] ?? [])];

  const candidates: readonly (Latest | null)[] = [
    history ? { what: history.what, when: history.when } : null,
    fromMessage(lastOf(agentLane)),
    fromMessage(lastOf(family)),
  ];

  let best: Latest | null = null;
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (best === null || placed(candidate.when) > placed(best.when)) {
      best = candidate;
    }
  }
  return best;
}

/**
 * The half of the footer that may be cut: who, and what they did.
 *
 * The tile is 235px and "Anusha · a rail bolts to brick · Today" does not
 * fit in it. Truncating the whole line takes the date off the end, which is
 * the half that answers "is this still moving" - so the line is drawn as two
 * cells, this one shrinking and the day holding its width.
 */
export function latestLead(latest: Latest | null): string {
  if (!latest) return "Not viewed, nothing said";
  const who = latest.who ? `${CAST[latest.who].name} · ` : "";
  return `${who}${latest.what}`;
}

/** The tile's footer, whole. Says what is missing when nothing has happened. */
export function latestLine(latest: Latest | null): string {
  if (!latest) return latestLead(latest);
  return `${latestLead(latest)} · ${latest.when}`;
}

/**
 * Where the purchase itself stands, in one line, for the top of the panel.
 *
 * Only an offer makes a status. Everything before one is a house she is
 * looking at, and a line saying so would be the product narrating that
 * nothing has happened. The words are the offer event's own - never rebuilt
 * from a figure typed here - and the closing date is a date rather than a
 * condition, which is why it sits in this sentence and not in the list of
 * things that still have to hold.
 */
export function statusLine(home: SavedHome): string {
  if (home.sold) return "Somebody else got it.";
  const offer = home.history.find((e) => e.kind === "offer");
  if (!offer) return "";
  const closes = home.closes ? ` Closes ${home.closes}.` : "";
  return `${offer.what}.${closes}`;
}

/* ------------------------------------------------------------------ */
/* Tiles                                                               */
/* ------------------------------------------------------------------ */

export interface SavedTile {
  listing: Listing;
  home: SavedHome;
  stage: Stage | undefined;
  /** The newest thing that happened to this house, for the tile's last line. */
  latest: Latest | null;
  collections: readonly Collection[];
  /** Saved a moment ago off a new match, with no fixture record. */
  justSaved: boolean;
}

/**
 * One tile per home in the list, in the list's order, filtered by the stage
 * pill if one is pressed.
 *
 * A home with no card in `listings.ts` is skipped rather than drawn blank:
 * the fixture test already fails when a search names one, and a blank tile
 * would be the page covering for it.
 */
export function tilesFor(
  list: SavedList,
  world: SavedWorld,
  session: SavedSession,
): readonly SavedTile[] {
  const kept = new Set(
    world.searches.flatMap((s) => searchSession(session, s.id).kept),
  );
  const tiles: SavedTile[] = [];
  for (const id of list.homeIds) {
    const listing = world.listings.find((l) => l.id === id);
    if (!listing) continue;
    const record = homeRecord(id, world);
    const home = record ?? justSavedHome(id);
    const stage = stageFor(home, session);
    if (session.stageFilter !== null && stage !== session.stageFilter) continue;
    tiles.push({
      listing,
      home,
      stage,
      latest: latestFor(home, session),
      collections: collectionsFor(id, session.collections),
      // Both halves, deliberately. A home she kept off a new match that
      // another search had already saved has a record, and its real date.
      justSaved: record === undefined && kept.has(id),
    });
  }
  return tiles;
}

export function collectionsFor(
  listingId: string,
  collections: readonly Collection[],
): readonly Collection[] {
  return collections.filter((c) => c.homeIds.includes(listingId));
}

/**
 * The searches and collections that also hold this home, so a new-match row can
 * say "you already saved this from Cedarbrae" instead of offering to save
 * it twice. A search holds a home when it is saved there, not merely found.
 */
export function alsoIn(
  listingId: string,
  world: SavedWorld,
  session: SavedSession,
  exceptListId: string,
): readonly SavedList[] {
  return [
    ...listsFor("searches", world, session),
    ...listsFor("collections", world, session),
  ].filter((l) => l.id !== exceptListId && l.homeIds.includes(listingId));
}

/* ------------------------------------------------------------------ */
/* The headline                                                        */
/* ------------------------------------------------------------------ */

/**
 * The window the fixture declares for "new". A new match carries no arrival
 * date, so this is stated, not read off one; `SAVED.newSinceTuesday` in
 * `counts.ts` is the same declaration from the other side.
 */
const NEW_SINCE = "Tuesday";

const NOTHING_CHANGED = "Nothing has changed since you saved it.";

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Homes with at least one event of this kind. Two cuts on one home is one home that cut its price. */
function homesWith(kind: HistoryKind, homes: readonly SavedHome[]): number {
  return homes.filter((h) => h.history.some((e) => e.kind === kind)).length;
}

/**
 * What the market did to the homes in a list, as one sentence, counted only
 * from `HistoryEvent.kind`. Session replies are what people said, not what
 * happened, so they do not count. Zero clauses are left out rather than
 * written as "none", and when every clause is zero the sentence says so
 * plainly.
 */
function changesFor(list: SavedList, homes: readonly SavedHome[]): string {
  const clauses: string[] = [];
  if (list.section === "searches" && list.newIds.length > 0) {
    clauses.push(`${spelled(list.newIds.length)} new since ${NEW_SINCE}`);
  }
  const sold = homesWith("sold", homes);
  if (sold > 0) clauses.push(`${spelled(sold)} sold`);
  const cuts = homesWith("price", homes);
  if (cuts > 0) {
    clauses.push(
      `${spelled(cuts)} cut ${plural(cuts, "its price", "their prices")}`,
    );
  }
  if (clauses.length === 0) return NOTHING_CHANGED;
  return `${capitalise(clauses.join(", "))}.`;
}

/**
 * The line under a list's name, derived. This replaces the sentence that
 * used to be typed into the page and read the same for every search.
 */
export function headlineFor(
  list: SavedList,
  world: SavedWorld,
  session: SavedSession,
): string {
  const homes = list.homeIds.map((id) => homeFor(id, world));
  const changes = changesFor(list, homes);
  const n = list.homeIds.length;

  switch (list.section) {
    case "searches": {
      const search = world.searches.find((s) => s.id === list.id);
      return search ? `Saved on ${search.savedOn}. ${changes}` : changes;
    }

    case "library": {
      const searches = world.searches.length;
      return `${capitalise(spelled(n))} across ${spelled(searches)} ${plural(searches, "search", "searches")}. ${changes}`;
    }

    case "collections": {
      // The header already says who it is shared with, so the headline is
      // her reason for the collection when she gave one, and otherwise its
      // shape.
      const collection = session.collections.find((c) => c.id === list.id);
      if (collection?.because) return collection.because;
      if (n === 0) return "Nothing in it yet, and nothing arrives here on its own.";
      const from = world.searches.filter((s) => {
        const held = effectiveSearchHomeIds(s, session);
        return list.homeIds.some((id) => held.includes(id));
      }).length;
      return `${capitalise(spelled(n))} ${plural(n, "home", "homes")}, from ${spelled(from)} ${plural(from, "search", "searches")}. Nothing arrives here on its own.`;
    }
  }
}
