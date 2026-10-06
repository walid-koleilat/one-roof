"use client";

/**
 * The top of the main column, for the library or a search.
 *
 * The old page typed its headline by hand and read "Two new since Tuesday,
 * one sold, one cut its price" over Woburn, where nothing was new and nothing
 * had sold. Nothing here is typed.
 *
 * The library gets a name and no line under it. The line it used to have
 * counted what the market did across eleven homes, and every one of those
 * facts is now the last line of the tile it belongs to, where it names the
 * house it happened to. A search keeps its line, because a search is the one
 * thing here that was working while she was away and its own news is the
 * reason to open it.
 *
 * The collection view has its own header and does not come through here.
 */

import Link from "next/link";
import { useSaved } from "@/components/saved/saved-provider";
import type { PersonId } from "@/data/saved";
import { headlineFor, names, type SavedList } from "@/lib/domain/saved-view";
import { cn } from "@/lib/utils";
import { Face } from "./share-menu";

export function ListHeader({ list }: { list: SavedList }) {
  const { state, world } = useSaved();
  const isSearch = list.section === "searches";

  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-[28px]/[36px] font-semibold tracking-[-0.02em] text-ink">
            {list.name}
          </h1>
          {isSearch ? (
            <p className="text-[15px]/[23px] text-ink-muted">
              {headlineFor(list, world, state)}
            </p>
          ) : null}
        </div>

        {isSearch ? <SharedWith people={list.sharedWith} /> : null}
      </div>

      {isSearch ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          {list.criteria.map((criterion) => (
            <span
              key={criterion}
              className="rounded-full bg-sunken px-3 py-1 text-[13px]/[19px] text-ink-body"
            >
              {criterion}
            </span>
          ))}
          <Link
            href="/homes-with-a-suite"
            className="rounded-sm px-1 text-[13px]/[19px] font-medium text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
          >
            Change
          </Link>
        </div>
      ) : null}
    </header>
  );
}

/**
 * Who can see this search, as faces with the names written under them.
 *
 * The faces are decoration over the sentence, not instead of it, so they are
 * hidden from a screen reader and the line carries the fact. Nothing here is
 * pressable: a search is shared from where it was made, and a header that
 * offered a share button with no reducer behind it would be a lie.
 */
function SharedWith({ people }: { people: readonly PersonId[] }) {
  if (people.length === 0) return null;
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span aria-hidden className="flex items-center -space-x-1.5">
        {people.map((person) => (
          <Face
            key={person}
            person={person}
            className={cn("ring-2 ring-background")}
          />
        ))}
      </span>
      <p className="text-[12px]/[18px] text-ink-muted">
        {names(people)}
        <span className="sr-only"> can see this search</span>
      </p>
    </div>
  );
}
