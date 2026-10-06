"use client";

import { useState } from "react";
import { AGENT, type Collection } from "@/data/saved";
import { headlineFor, type SavedList } from "@/lib/domain/saved-view";
import { useSaved } from "./saved-provider";
import { Face, ShareMenu } from "./share-menu";

/**
 * The top of a collection: her name for it, why she made it, and who else is
 * in it.
 *
 * The reason is the header line, not a caption under a count. *No step at
 * the front, and a bathroom he does not have to climb to* is the whole
 * argument for the collection existing - no search returns that set, and she had
 * been keeping it in her head - so it is the sentence under the name and the
 * counting has gone. How many homes are in it is on the rail row she pressed
 * to get here, and how many searches they came from was a fact about the
 * filing system rather than about her father.
 *
 * Invite sits beside the faces, in words. It was a dashed circle with a plus
 * in it, which is a control that has to be recognised before it can be used.
 * Sharing is the one place on this page where somebody else gets to see
 * anything, and the boundary belongs next to the button that moves it, which
 * is why the sentence is in the menu the button opens.
 */
export function CollectionHeader({
  list,
  collection,
}: {
  list: SavedList;
  collection: Collection;
}) {
  const { state, world } = useSaved();
  const [sharing, setSharing] = useState(false);

  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
        <h1 className="min-w-0 text-[28px]/[36px] font-semibold tracking-[-0.02em] text-ink">
          {collection.name}
        </h1>

        <div className="flex shrink-0 items-center gap-2">
          {collection.sharedWith.length > 0 ? (
            <span aria-hidden className="flex items-center -space-x-1.5">
              {collection.sharedWith.map((person) => (
                <Face key={person} person={person} className="ring-2 ring-background" />
              ))}
            </span>
          ) : null}
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setSharing(true)}
            className="rounded-full border border-hairline-strong px-3.5 py-1.5 text-[13px]/[19px] font-medium text-ink transition-colors duration-150 ease-out hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
          >
            Invite
          </button>
        </div>
      </div>

      <p className="max-w-[640px] text-[15px]/[23px] text-ink-muted">
        {collection.because ?? headlineFor(list, world, state)}
      </p>

      <p className="text-[12px]/[18px] text-ink-muted">
        Family only. {AGENT.name} is never on a collection.
      </p>

      <ShareMenu
        collectionId={collection.id}
        open={sharing}
        onOpenChange={setSharing}
      />
    </header>
  );
}
