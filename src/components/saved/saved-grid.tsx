"use client";

import { useSaved } from "@/components/saved/saved-provider";
import { SavedTile } from "@/components/saved/saved-tile";
import { stageLabel, tilesFor, type SavedList } from "@/lib/domain/saved-view";

/**
 * The homes in whichever list is open, with nothing decided here about which
 * homes those are.
 *
 * `tilesFor` works the list out from the fixture, what she did this session
 * and whichever stage pill is pressed, so the grid cannot show a home the
 * rail has let go of, and it cannot keep a copy that drifts. This file lays
 * the tiles out and says, when there are none, what would put one here -
 * which differs by the kind of list, because a collection fills from a panel and a
 * search fills from the search, and saying "nothing here" without saying
 * that is a gap dressed as a fact.
 *
 * The grid is two across on a phone, three on a tablet, four on a desktop,
 * and the gap is the same at every width. Tiles fade in over 250ms when a
 * list opens and do nothing else; a number is never animated.
 */
export function SavedGrid({ list }: { list: SavedList }) {
  const { state, world } = useSaved();
  const tiles = tilesFor(list, world, state);

  if (tiles.length === 0) return <EmptyGrid list={list} />;

  return (
    <ul
      aria-label={list.name}
      className="grid grid-cols-2 gap-x-5 gap-y-[26px] md:grid-cols-3 lg:grid-cols-4"
    >
      {tiles.map((tile) => (
        <li
          key={tile.listing.id}
          className="grid min-w-0 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-250 motion-safe:ease-out"
        >
          <SavedTile tile={tile} />
        </li>
      ))}
    </ul>
  );
}

/**
 * What would put something here, by the kind of list. When a stage pill is
 * the reason the grid is empty it says so first, because "save one from a
 * search" is unhelpful advice to somebody looking at eleven saved homes
 * through a filter.
 */
function whatWouldFill(list: SavedList): string {
  switch (list.section) {
    case "library":
      return "Save one from any search.";
    case "collections":
      return "Open a home and add it to this collection from its panel.";
    case "searches":
      return "Save one from the search.";
  }
}

function EmptyGrid({ list }: { list: SavedList }) {
  const { state } = useSaved();
  const filtered = state.stageFilter !== null;

  return (
    <div className="rounded-xl bg-sunken px-5 py-6">
      <p className="text-[15px]/[23px] font-semibold text-ink">
        {filtered
          ? `Nothing in ${list.name} is at ${stageLabel(state.stageFilter!).toLowerCase()}.`
          : "Nothing here yet."}
      </p>
      <p className="mt-1 text-[13px]/[19px] text-ink-muted">
        {filtered ? "Press All to see the rest." : whatWouldFill(list)}
      </p>
    </div>
  );
}
