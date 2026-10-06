import { CAST, type Collection, type Message, type Note } from "@/data/saved";
import {
  EMPTY_SEARCH_SESSION,
  agentKey,
  type SavedAction,
  type SavedSession,
  type SearchSession,
} from "./saved-session";

/**
 * How the saved page's session changes, one action at a time, with the
 * search it belongs to written into every change that touches one.
 *
 * The bug this file exists to fix was not on any line. Removed, kept and
 * waved were three lists of listing ids held for the whole page, so taking
 * 7 Brimley out of Cedarbrae also took it out of Bendale's new matches, and
 * nothing that read the lists could have known better. The fix is that an
 * action on a search names the search, and `withSearch` is the only thing
 * here allowed to write `perSearch`. It writes one key. The regression is
 * three lines in `saved-reducer.test.ts`.
 *
 * Everything here is pure. The reducer never mutates what it is given, and
 * it hands back the same object when an action changes nothing, so a blank
 * reply or an empty collection name is a no-op the page can ignore rather
 * than a render. Ids come from `seq`, never from a clock or a random source:
 * the server and the client must agree on what she named the third box. And
 * `when` is stamped as the phrase "Today", the same way every other date on
 * this page is a phrase, because turning a click into a timestamp would be
 * the product inventing a calendar.
 */

/** `list` with `id` in it once. The same array when it was already there. */
function withId<T extends string>(list: readonly T[], id: T): readonly T[] {
  return list.includes(id) ? list : [...list, id];
}

/** `list` without `id`. The same array when it was never there. */
function withoutId<T extends string>(list: readonly T[], id: T): readonly T[] {
  return list.includes(id) ? list.filter((x) => x !== id) : list;
}

function toggled(list: readonly string[], id: string): readonly string[] {
  return list.includes(id) ? withoutId(list, id) : withId(list, id);
}

/** Toggle `id` inside `record[key]`, leaving every other key by reference. */
function toggledIn(
  record: Record<string, readonly string[]>,
  key: string,
  id: string,
): Record<string, readonly string[]> {
  return { ...record, [key]: toggled(record[key] ?? [], id) };
}

/**
 * Change one search's session and no other's.
 *
 * A search she has not touched reads as empty and is created from the empty
 * session on first write. No other key in `perSearch` is rebuilt, so a test
 * can hold the other searches to reference equality.
 */
function withSearch(
  state: SavedSession,
  searchId: string,
  change: (s: SearchSession) => SearchSession,
): SavedSession {
  const current = state.perSearch[searchId] ?? EMPTY_SEARCH_SESSION;
  return {
    ...state,
    perSearch: { ...state.perSearch, [searchId]: change(current) },
  };
}

/**
 * Change one collection and no other. An id no collection has is a no-op,
 * and so is a change that hands the same collection back.
 */
function withCollection(
  state: SavedSession,
  collectionId: string,
  change: (c: Collection) => Collection,
): SavedSession {
  const current = state.collections.find((c) => c.id === collectionId);
  if (!current) return state;
  const next = change(current);
  if (next === current) return state;
  return {
    ...state,
    collections: state.collections.map((c) => (c === current ? next : c)),
  };
}

export function savedReducer(
  state: SavedSession,
  action: SavedAction,
): SavedSession {
  switch (action.type) {
    case "section":
      return action.section === state.section
        ? state
        : { ...state, section: action.section };

    case "openList":
      // Opening a list is how she gets to a section, so the section follows.
      // The stage pill goes back to all of them: it was counted against the
      // list she was in, and carrying it over shows an empty grid for a
      // reason nothing on screen explains.
      return {
        ...state,
        section: action.section,
        openList: { ...state.openList, [action.section]: action.id },
        stageFilter: null,
      };

    case "filterStage":
      return action.stage === state.stageFilter
        ? state
        : { ...state, stageFilter: action.stage };

    case "open":
      return { ...state, panel: action.panel };

    case "close":
      return state.panel === null ? state : { ...state, panel: null };

    case "remove":
      return withSearch(state, action.searchId, (s) => ({
        ...s,
        removed: withId(s.removed, action.listingId),
      }));

    case "keep":
      return withSearch(state, action.searchId, (s) => ({
        ...s,
        kept: withId(s.kept, action.listingId),
        waved: withoutId(s.waved, action.listingId),
      }));

    case "wave":
      return withSearch(state, action.searchId, (s) => ({
        ...s,
        waved: withId(s.waved, action.listingId),
        kept: withoutId(s.kept, action.listingId),
      }));

    case "showNew":
      return withSearch(state, action.searchId, (s) => ({ ...s, showNew: true }));

    case "dismissNew":
      return withSearch(state, action.searchId, (s) => ({
        ...s,
        dismissedNew: true,
      }));

    case "reply": {
      const text = action.text.trim();
      // A voice note with no transcript is still a message. Nothing at all is not.
      if (text === "" && !action.voice) return state;
      const message: Message = {
        id: `session-m${state.seq}`,
        from: action.from,
        when: "Today",
        text,
        ...(action.voice ? { voice: action.voice } : {}),
      };
      const existing = state.replies[action.on] ?? [];
      return {
        ...state,
        replies: { ...state.replies, [action.on]: [...existing, message] },
        seq: state.seq + 1,
      };
    }

    case "tick":
      return {
        ...state,
        ticked: toggledIn(state.ticked, action.listingId, action.noteId),
      };

    case "addNote": {
      const what = action.what.trim();
      if (what === "") return state;
      const note: Note = { id: `session-n${state.seq}`, what };
      const existing = state.added[action.listingId] ?? [];
      return {
        ...state,
        added: { ...state.added, [action.listingId]: [...existing, note] },
        seq: state.seq + 1,
      };
    }

    case "setAgent":
      // Kept as a key either way, so the view can tell "she took the agent
      // off" from "the fixture never put one on".
      return { ...state, seat: { ...state.seat, [action.listingId]: action.on } };

    case "forward": {
      // Sent once. Pressing it again is not a second message, and after the
      // panel closes and reopens the row still says it went.
      const already = state.forwarded[action.listingId] ?? [];
      if (already.includes(action.messageId)) return state;
      const message: Message = {
        id: `session-m${state.seq}`,
        from: action.from,
        when: "Today",
        text: action.text,
        forwarded: true,
        ...(action.voice ? { voice: action.voice } : {}),
      };
      const key = agentKey(action.listingId);
      const existing = state.replies[key] ?? [];
      return {
        ...state,
        replies: { ...state.replies, [key]: [...existing, message] },
        forwarded: {
          ...state.forwarded,
          [action.listingId]: [...already, action.messageId],
        },
        seq: state.seq + 1,
      };
    }

    case "tickCondition":
      return {
        ...state,
        conditionsDone: toggledIn(
          state.conditionsDone,
          action.listingId,
          action.conditionId,
        ),
      };

    case "setStage":
      // Null is kept as a key, so the view can tell "cleared" from "never set".
      return {
        ...state,
        stages: { ...state.stages, [action.listingId]: action.stage },
      };

    case "collect":
      return withCollection(state, action.collectionId, (c) => {
        const homeIds = withId(c.homeIds, action.listingId);
        return homeIds === c.homeIds ? c : { ...c, homeIds };
      });

    case "uncollect":
      return withCollection(state, action.collectionId, (c) => {
        const homeIds = withoutId(c.homeIds, action.listingId);
        return homeIds === c.homeIds ? c : { ...c, homeIds };
      });

    case "share":
      // Sharing emails the people she names, and nothing here goes to an
      // agent. That is the footer's promise, so it is enforced here rather
      // than left to whichever menu happens to list the cast.
      if (CAST[action.person].tone === "agent") return state;
      return withCollection(state, action.collectionId, (c) => {
        const sharedWith = withId(c.sharedWith, action.person);
        return sharedWith === c.sharedWith ? c : { ...c, sharedWith };
      });

    case "unshare":
      return withCollection(state, action.collectionId, (c) => {
        const sharedWith = withoutId(c.sharedWith, action.person);
        return sharedWith === c.sharedWith ? c : { ...c, sharedWith };
      });

    case "newCollection": {
      const name = action.name.trim();
      // There is never an untitled collection.
      if (name === "") return state;
      const because = action.because?.trim();
      const id = `session-c${state.seq}`;
      const collection: Collection = {
        id,
        name,
        ...(because ? { because } : {}),
        madeOn: action.madeOn,
        homeIds: action.firstListingId ? [action.firstListingId] : [],
        sharedWith: [],
        thread: [],
      };
      // She just made it. She expects to be looking at it.
      return {
        ...state,
        collections: [...state.collections, collection],
        section: "collections",
        openList: { ...state.openList, collections: id },
        seq: state.seq + 1,
      };
    }

    case "setSelling":
      return { ...state, selling: action.selling };
  }
}
