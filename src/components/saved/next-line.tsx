"use client";

import { useSaved } from "@/components/saved/saved-provider";
import { homeFor, type SavedList } from "@/lib/domain/saved-view";
import { nextItem, nextLine } from "@/lib/domain/saved-week";

/**
 * The next thing with a date on it, across the homes in this list.
 *
 * It replaced a folded list of everything outstanding - eleven rows of
 * chores at the top of a page about houses, every one of which was already
 * on the home it came from. What no home can answer on its own is "what is
 * the next thing, and whose is it", so that is what this asks and all it
 * asks. Pressing it opens the home the thing belongs to.
 *
 * Only a dated thing qualifies. A note that says "on Saturday" has no date,
 * because reading a day out of a sentence would be the product inventing a
 * calendar, so the line goes quiet rather than guessing. When it is quiet
 * there is nothing here at all: a row saying "nothing is due" is a row that
 * costs the same as one that says something.
 */
export function NextLine({ list }: { list: SavedList }) {
  const { state, world, dispatch } = useSaved();
  const homes = list.homeIds.map((id) => homeFor(id, world));
  const item = nextItem(homes, state);
  if (!item) return null;

  const address = world.listings.find((l) => l.id === item.listingId)?.address;

  return (
    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
      <span className="font-mono text-[11px] tracking-[0.1em] text-ink-muted uppercase">
        Next
      </span>
      <button
        type="button"
        onClick={() =>
          dispatch({ type: "open", panel: { kind: "home", id: item.listingId } })
        }
        className="rounded-sm text-left text-[15px]/[22px] text-ink outline-none ease-out hover:text-ink-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action motion-safe:transition-colors motion-safe:duration-150"
      >
        {nextLine(item, address)}
      </button>
    </div>
  );
}
