"use client";

/**
 * The watch, and it is an offer rather than a notification.
 *
 * Homes matched this search while she was not looking. They are not shown
 * until she asks, and "Not now" genuinely dismisses them, because the moment
 * a saved search starts pushing things at her it becomes the thing she mutes.
 *
 * Everything it reads and everything it changes goes through this search's
 * own session, `searchSession(state, search.id)`. That is the fix for the bug
 * that made this file: waving a home off Cedarbrae's list used to wave it off
 * Bendale's too, because the page kept one list for all three. The count on
 * the circle is how many are still unanswered, a fact, not how many she has
 * read.
 */

import { useSaved } from "@/components/saved/saved-provider";
import type { SavedSearch } from "@/data/saved";
import type { Listing } from "@/data/listings";
import { formatCurrency, spelled } from "@/lib/domain/format";
import { metricsLine } from "@/lib/domain/listing";
import { searchSession } from "@/lib/domain/saved-session";
import { alsoIn } from "@/lib/domain/saved-view";

/** "Show me", "Show me both", "Show me all three". */
function showLabel(n: number): string {
  if (n === 1) return "Show me";
  if (n === 2) return "Show me both";
  return `Show me all ${spelled(n)}`;
}

export function NewMatches({ search }: { search: SavedSearch }) {
  const { state, dispatch, world } = useSaved();
  const session = searchSession(state, search.id);

  // A new match she kept is saved now; one she waved off is gone. Either way
  // it has stopped being new, and once none are left there is nothing to say.
  const answered = new Set([...session.kept, ...session.waved]);
  const ids = search.newIds.filter((id) => !answered.has(id));
  if (ids.length === 0 || session.dismissedNew) return null;

  const listings = ids
    .map((id) => world.listings.find((l) => l.id === id))
    .filter((l): l is Listing => l !== undefined);

  const one = ids.length === 1;

  return (
    <section
      aria-label="New matches"
      className="flex flex-col gap-3 rounded-2xl bg-action-tint px-4 py-4 sm:px-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-action text-[12px] font-semibold text-white"
          >
            {ids.length}
          </span>
          <div className="flex flex-col">
            <p className="text-[15px]/[23px] font-semibold text-ink">
              <span className="sr-only">{spelled(ids.length)} </span>
              {one ? "new home matched this search" : "new homes matched this search"}
            </p>
            <p className="text-[13px]/[19px] text-ink-muted">
              {one
                ? "Since Tuesday. Save it if you want it, and otherwise it goes quiet."
                : "Since Tuesday. Save the ones you want and the rest go quiet."}
            </p>
          </div>
        </div>

        {session.showNew ? null : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: "dismissNew", searchId: search.id })}
              className="rounded-full px-3 py-2 text-[13px]/[19px] font-medium text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "showNew", searchId: search.id })}
              className="rounded-full bg-ink px-4 py-2 text-[13px]/[19px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
            >
              {showLabel(ids.length)}
            </button>
          </div>
        )}
      </div>

      {session.showNew ? (
        <ul className="grid grid-cols-1 gap-3 ease-out motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-250 sm:grid-cols-2">
          {listings.map((listing) => (
            <MatchRow
              key={listing.id}
              listing={listing}
              alreadyFrom={
                alsoIn(listing.id, world, state, search.id).find(
                  (l) => l.section === "searches",
                )?.name
              }
              onKeep={() =>
                dispatch({ type: "keep", searchId: search.id, listingId: listing.id })
              }
              onWave={() =>
                dispatch({ type: "wave", searchId: search.id, listingId: listing.id })
              }
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/**
 * One home she has not answered yet. The photograph is a swatch, not a
 * carousel: this row exists to be kept or waved off, not browsed. When
 * another search already holds the home the row says so, because offering
 * to save a house twice is the page forgetting what she did.
 */
function MatchRow({
  listing,
  alreadyFrom,
  onKeep,
  onWave,
}: {
  listing: Listing;
  alreadyFrom: string | undefined;
  onKeep: () => void;
  onWave: () => void;
}) {
  const photo = listing.photos[0];

  return (
    <li className="flex items-center gap-3 rounded-xl bg-background p-2.5">
      <span
        aria-hidden
        className="size-14 shrink-0 rounded-lg bg-cover bg-center"
        style={{
          backgroundColor: listing.photoTint,
          backgroundImage: photo ? `url(${photo})` : undefined,
        }}
      />
      <span className="flex min-w-0 grow flex-col">
        <span className="truncate text-sm/5 font-semibold text-ink">
          {listing.address}
        </span>
        <span className="text-[12px]/[18px] text-ink-muted">
          {metricsLine(listing.metrics, { compact: true })}
        </span>
        <span className="text-[13px]/[19px] font-semibold text-ink">
          {formatCurrency(listing.askingPrice.value)}
        </span>
        {alreadyFrom ? (
          <span className="text-[12px]/[18px] text-ink-muted">
            You already saved this from {alreadyFrom}.
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <button
          type="button"
          onClick={onKeep}
          aria-label={`Save ${listing.address}`}
          className="rounded-full bg-ink px-3 py-1.5 text-[12px]/[18px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onWave}
          aria-label={`Not this one, ${listing.address}`}
          className="rounded-sm px-1 text-[11px]/[17px] text-ink-faint underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
        >
          Not this one
        </button>
      </span>
    </li>
  );
}
