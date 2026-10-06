import type {
  Collection,
  Message,
  Note,
  PersonId,
  Stage,
  VoiceClip,
} from "@/data/saved";

/**
 * What she has done on the saved page this session, as one shape.
 *
 * The page used to hold eight `useState`s, and three of them - what she had
 * removed, kept and waved off - were lists of listing ids with no memory of
 * which search they belonged to. Removing 7 Brimley from Cedarbrae removed it
 * from Bendale's new matches too, and no test could catch that because the
 * bug was in the shape of the state rather than in any line that read it.
 *
 * So the shape is declared here, per search, and the reducer that changes it
 * lives beside it with no React in sight. The regression becomes three lines
 * in a test. That is the whole reason this file exists.
 *
 * Nothing here persists. Reloading forgets it, which is the honest behaviour
 * for something with no server behind it.
 */

/**
 * The three kinds of list in the rail, in the order they are drawn.
 *
 * There were four. *Where they are up to* was a section of its own, five
 * rows deep, and it was a filter wearing a list's clothes: opening "Visited"
 * left the box she had been in, and coming back meant finding it again. The
 * stages are now a row of pills over whichever list is open, so "the two I
 * have seen, inside Ones Appa can manage" is a thing she can ask for and
 * used not to be.
 */
export type RailSection = "library" | "collections" | "searches";

/** What she has done to one search. The scope is the shape, not the caller. */
export interface SearchSession {
  /** Homes she took out of this search. */
  removed: readonly string[];
  /** New matches she kept, and ones she waved off. */
  kept: readonly string[];
  waved: readonly string[];
  /** She pressed "Show me both" on this one. */
  showNew: boolean;
  dismissedNew: boolean;
}

export const EMPTY_SEARCH_SESSION: SearchSession = {
  removed: [],
  kept: [],
  waved: [],
  showNew: false,
  dismissedNew: false,
};

/** What is open over the page. Nothing below the provider knows this exists. */
export type Panel =
  | { kind: "home"; id: string }
  | { kind: "collection"; id: string };

/**
 * The key the agent lane's session replies live under.
 *
 * A home has two conversations - the family's and the one with the agent - and
 * a reply must land in exactly one. The family lane is keyed by the listing id;
 * the agent lane is that id with a suffix no listing id can collide with. The
 * reducer's one `reply` path serves both, because the only difference between
 * the lanes is which key the message is filed under.
 */
export function agentKey(listingId: string): string {
  return `${listingId}::agent`;
}

/**
 * Her own home, once she has given it.
 *
 * Null until then, and while it is null the ceiling is a guess and every
 * budget verdict says so. This is the one thing the page asks for.
 */
export interface SellingInput {
  address: string;
}

export interface SavedSession {
  section: RailSection;
  /** Which list is open in each section, so switching keeps her place. */
  openList: Record<RailSection, string>;
  /** Keyed by search id. A search she has not touched reads as empty. */
  perSearch: Record<string, SearchSession>;
  /** The fixture's collections plus any she made, with any membership changes. */
  collections: readonly Collection[];
  /** Appended this session, keyed by listing id or collection id. Never written back into the fixture. */
  replies: Record<string, readonly Message[]>;
  /** Note ids she has ticked, per listing. */
  ticked: Record<string, readonly string[]>;
  /** Lines she added, per listing. */
  added: Record<string, readonly Note[]>;
  /** Condition ids she has ticked, per listing. */
  conditionsDone: Record<string, readonly string[]>;
  /**
   * Whether the agent has a seat on a home, where she has changed it. A key
   * missing means the fixture's own answer stands. The seat is per home and
   * never per collection or per search: an agent sees the houses she was
   * asked about, and nothing around them.
   */
  seat: Record<string, boolean>;
  /**
   * Family-lane message ids already sent to the agent, per listing. Kept so
   * the same message cannot be sent twice, and so that the button still says
   * it was sent after the panel has been closed and reopened.
   */
  forwarded: Record<string, readonly string[]>;
  /** Stages she set this session. A key with no value means she cleared it. */
  stages: Record<string, Stage | null>;
  /**
   * The stage pill pressed above the grid, or null for all of them. It is
   * cleared when she opens another list, because a filter that survives the
   * list it was counted against is a grid that looks empty for no reason.
   */
  stageFilter: Stage | null;
  panel: Panel | null;
  selling: SellingInput | null;
  /** Deterministic id source for anything she creates. Not randomUUID: the server and the client must agree. */
  seq: number;
}

export type SavedAction =
  | { type: "section"; section: RailSection }
  | { type: "openList"; section: RailSection; id: string }
  | { type: "open"; panel: Panel }
  | { type: "close" }
  | { type: "remove"; searchId: string; listingId: string }
  | { type: "keep"; searchId: string; listingId: string }
  | { type: "wave"; searchId: string; listingId: string }
  | { type: "showNew"; searchId: string }
  | { type: "dismissNew"; searchId: string }
  /** `on` is a listing id or a collection id. The reducer stamps `when` as "Today". */
  | { type: "reply"; on: string; from: PersonId; text: string; voice?: VoiceClip }
  | { type: "tick"; listingId: string; noteId: string }
  | { type: "addNote"; listingId: string; what: string }
  | { type: "tickCondition"; listingId: string; conditionId: string }
  | { type: "setStage"; listingId: string; stage: Stage | null }
  /** The pill row over the grid. Null is "all of them". */
  | { type: "filterStage"; stage: Stage | null }
  | { type: "collect"; collectionId: string; listingId: string }
  | { type: "uncollect"; collectionId: string; listingId: string }
  /** She puts the agent on one home, or takes her off it. Nobody else can. */
  | { type: "setAgent"; listingId: string; on: boolean }
  /**
   * One message out of the family lane and into the lane the agent reads,
   * sent by whoever wrote it. A message about the budget is never sendable,
   * and the reducer is not the place that decides which those are - the
   * fixture declares it and `isSendable` reads the declaration.
   */
  | {
      type: "forward";
      listingId: string;
      messageId: string;
      from: PersonId;
      text: string;
      voice?: VoiceClip;
    }
  /** Sharing emails the people she names. The agent is never one of them; the reducer refuses. */
  | { type: "share"; collectionId: string; person: PersonId }
  | { type: "unshare"; collectionId: string; person: PersonId }
  /** A blank or whitespace name is a no-op. There is never an untitled box. */
  | {
      type: "newCollection";
      name: string;
      because?: string;
      madeOn: string;
      firstListingId?: string;
    }
  | { type: "setSelling"; selling: SellingInput | null };

/** The id the library uses in `openList`. There is only one library. */
export const LIBRARY_ID = "all";

export function initSession(seed: {
  collections: readonly Collection[];
  firstSearchId: string;
}): SavedSession {
  return {
    section: "library",
    openList: {
      library: LIBRARY_ID,
      collections: seed.collections[0]?.id ?? "",
      searches: seed.firstSearchId,
    },
    perSearch: {},
    collections: seed.collections,
    replies: {},
    ticked: {},
    added: {},
    conditionsDone: {},
    seat: {},
    forwarded: {},
    stages: {},
    stageFilter: null,
    panel: null,
    selling: null,
    seq: 0,
  };
}

/** Read one search's session, defaulting to empty. The only way to read it. */
export function searchSession(
  s: SavedSession,
  searchId: string,
): SearchSession {
  return s.perSearch[searchId] ?? EMPTY_SEARCH_SESSION;
}
