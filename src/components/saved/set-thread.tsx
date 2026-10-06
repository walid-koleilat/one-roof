"use client";

import { useId } from "react";
import { AGENT, type Collection } from "@/data/saved";
import { spelled } from "@/lib/domain/format";
import { listById } from "@/lib/domain/saved-view";
import { useSaved } from "./saved-provider";
import { SavedThread } from "./saved-thread";

/**
 * The conversation about a collection as a whole, under its grid.
 *
 * A note about one house lives on that house, and the panel is where it
 * goes. This box is for the sentence that is about the set - "two of the
 * three are inside" - which has no house to hang on. The label counts the
 * homes the collection still holds, read the same way the header reads it,
 * so the two cannot disagree. The thread underneath is the same
 * `SavedThread` the panel uses, keyed on the collection's id instead of a
 * listing's, so her reply lands in `state.replies[collection.id]` and
 * nowhere else. The composer is told what it is about - "Write something
 * about all three" - because the panel's "Write something" is about a
 * house, and this is not. `SavedThread` draws no box, so the sunken one
 * here is the only one.
 */

/**
 * "all three". One home is not "all", and an empty collection has no count. The
 * label and the composer both read this, so they cannot disagree.
 */
function aboutPhrase(n: number): string {
  if (n === 0) return "the set";
  if (n === 1) return "the one";
  return `all ${spelled(n)}`;
}

/** "About all three". */
function aboutLabel(n: number): string {
  return `About ${aboutPhrase(n)}`;
}

/** "Write something about all three". */
function composerLabel(n: number): string {
  return `Write something about ${aboutPhrase(n)}`;
}

export function SetThread({ collection }: { collection: Collection }) {
  const { state, world } = useSaved();
  const labelId = useId();

  // The list's count, not the collection's own: it only shows what is
  // still saved, and the header counts the same way.
  const held =
    listById("collections", collection.id, world, state)?.homeIds.length ??
    collection.homeIds.length;

  return (
    <section
      aria-labelledby={labelId}
      className="flex flex-col gap-3 rounded-xl bg-sunken px-4 py-4 sm:px-5"
    >
      <div className="flex flex-col gap-1">
        <p
          id={labelId}
          className="font-mono text-[10px] tracking-[0.1em] text-ink-faint uppercase"
        >
          {aboutLabel(held)}
        </p>
        <p className="text-[13px]/[19px] text-ink-muted">
          Family only. {AGENT.name} is never on a collection.
        </p>
      </div>

      <SavedThread
        on={collection.id}
        fixture={collection.thread}
        placeholder={composerLabel(held)}
      />
    </section>
  );
}
