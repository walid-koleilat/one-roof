import { CAST, WHEN_ORDER, type PersonId, type SavedHome } from "@/data/saved";
import type { SavedSession } from "./saved-session";
import { stageFor } from "./saved-view";

/**
 * Everything she still has to do, across every home she saved, in her order.
 *
 * Each home already holds its own list - the lines still open before the keys
 * at Ellendale, three conditions on the offer with a date and a name against
 * each, a list to take to Marcos on Saturday. What no single home can hold is
 * the week: the tape measure and the financing deadline are on different
 * panels, and by Thursday she is reading eleven panels to answer "what do I
 * actually have to do". This file reads them for her and hands back one list.
 *
 * Two rules from the fixture carry through and are the reason this is domain
 * code rather than a component's loop:
 *
 *   A date is a phrase placed in `WHEN_ORDER`, never a string read for a day.
 *   A condition has a `by`; a note has nothing. A note that says "on
 *   Saturday" has no date, because guessing one from its words would be the
 *   product inventing a calendar. Undated things sit after dated ones, in
 *   the order she wrote them.
 *
 *   Where she has got to with a home is hers to say, and once she has said
 *   "gone" the home stops asking anything of her. There is no visiting a
 *   house somebody else bought, and a checklist that outlives the sale is
 *   the kind of thing this product exists to stop. Which stage a home is at
 *   is `stageFor` from `saved-view`, the one rule for it in the repo.
 *
 * `history` is not read here at all. It is what the market did, and none of
 * it is a task.
 */

export type WeekKind = "task" | "condition";

export interface WeekItem {
  /** The note id or the condition id. */
  id: string;
  kind: WeekKind;
  listingId: string;
  /** The words from the source record, never rewritten. */
  what: string;
  /** A `WHEN_ORDER` phrase when the source has one (a condition's `by`); "" for a plain note. */
  when: string;
  /**
   * Position in her week from `WHEN_ORDER`. Items with no date all share one
   * key past every dated one; among themselves they keep the order `weekFor`
   * returns, which is listing order and then note order.
   */
  order: number;
  /** A condition's owner. A note has none; it is hers. */
  who?: PersonId;
  /**
   * What to call whoever is holding it, when it is not one person in the
   * cast: "you and Arun" on a deposit, "Arun's bank" on the financing.
   * Written as it reads mid-sentence, because that is where it is read.
   */
  holder?: string;
}

/**
 * The sort key for anything without a date: one past the furthest phrase
 * `WHEN_ORDER` places. Computed rather than written so a new phrase further
 * out cannot quietly land after the undated items. It is a key, not a day.
 */
const AFTER_EVERY_DATE = Math.max(...Object.values(WHEN_ORDER)) + 1;

export function weekFor(
  homes: readonly SavedHome[],
  session: SavedSession,
): readonly WeekItem[] {
  const dated: WeekItem[] = [];
  const undated: WeekItem[] = [];

  for (const home of homes) {
    if (stageFor(home, session) === "gone") continue;

    const ticked = session.ticked[home.listingId] ?? [];
    const added = session.added[home.listingId] ?? [];
    const cleared = session.conditionsDone[home.listingId] ?? [];

    // Fixture notes first, then the ones she added, so "note order" is the
    // order she has seen them in on the panel. The same predicate applies to
    // both: a line is out of the week once it is done, however it got done.
    for (const note of [...home.notes, ...added]) {
      if (note.done || ticked.includes(note.id)) continue;
      undated.push({
        id: note.id,
        kind: "task",
        listingId: home.listingId,
        what: note.what,
        when: "",
        order: AFTER_EVERY_DATE,
      });
    }

    for (const condition of home.conditions ?? []) {
      if (condition.done || cleared.includes(condition.id)) continue;
      const placed = WHEN_ORDER[condition.by];
      const item: WeekItem = {
        id: condition.id,
        kind: "condition",
        listingId: home.listingId,
        what: condition.what,
        // A phrase the week cannot place is not a position in the week. The
        // fixture test forbids one, so this branch is defensive, but the type
        // is honest about the lookup and so is the item.
        when: placed === undefined ? "" : condition.by,
        order: placed ?? AFTER_EVERY_DATE,
        who: condition.who,
        ...(condition.holder ? { holder: condition.holder } : {}),
      };
      (placed === undefined ? undated : dated).push(item);
    }
  }

  // Stable, so two conditions on the same day keep home order.
  dated.sort((a, b) => a.order - b.order);
  return [...dated, ...undated];
}

/**
 * The one thing with a date on it that comes next, across every home.
 *
 * This replaced a folded list of everything outstanding. The list was
 * honest and it was also eleven rows of chores at the top of a page about
 * houses, and every row on it was already on the home it came from. What no
 * home can answer on its own is "what is the next thing, and whose is it",
 * so that is what the page asks and all it asks.
 *
 * Only a dated thing can be next. A note that says "on Saturday" has no
 * date - guessing one from its words would be the product inventing a
 * calendar - so an undated task is never returned here, however urgent it
 * reads.
 */
export function nextItem(
  homes: readonly SavedHome[],
  session: SavedSession,
): WeekItem | null {
  return weekFor(homes, session).find((item) => item.when !== "") ?? null;
}

/**
 * The next thing as one sentence, with whoever is holding it.
 *
 * A person in the cast holds it; an arrangement is who it is with. Both
 * shapes are grammatical without the sentence having to work out whether a
 * name is singular, which is the kind of guess that produces "Arun's bank
 * holds it" one day and "You and Arun holds it" the next.
 */
export function nextLine(item: WeekItem, address?: string): string {
  const where = address ? ` at ${address}` : "";
  const holder = item.holder
    ? `With ${item.holder}.`
    : item.who
      ? `${CAST[item.who].name} holds it.`
      : "";
  return `${item.what}${where}, ${item.when}. ${holder}`.trimEnd();
}
