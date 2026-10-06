"use client";

import { useState } from "react";
import type { Note, SavedHome } from "@/data/saved";
import { cn } from "@/lib/utils";
import { useSaved } from "./saved-provider";

/**
 * Her own lines on a home: the list she takes to a visit, and what she wrote
 * after standing in it.
 *
 * This band is hers and looks like it - a teal label where the market's band
 * has a grey one. The fixture's notes come first and the ones she added this
 * session follow, in the order she wrote them, because that is the order the
 * week strip reads them in and the two must agree. A line is done when the
 * fixture says so or when she ticked it here; either way it is struck through
 * and out of her week, and a fixture line written as done cannot be unticked
 * because there is no record to untick it into.
 *
 * Nothing here is stored in the component. Ticks and additions go to the
 * reducer, which is why closing the panel no longer loses them.
 */
export function SavedNotes({ home }: { home: SavedHome }) {
  const { state, dispatch } = useSaved();
  const [draft, setDraft] = useState("");
  const id = home.listingId;
  const ticked = state.ticked[id] ?? [];
  const notes: readonly Note[] = [...home.notes, ...(state.added[id] ?? [])];

  return (
    <section className="flex flex-col gap-2 border-t border-hairline pt-4">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <p className="font-mono text-[11px] tracking-[0.1em] text-action-deep uppercase">
          {home.notesTitle ?? "My notes"}
        </p>
        {/*
          The one band on the panel that never leaves the household, whoever
          else is on the home. Said here rather than assumed, because it is
          the band she would most regret being read.
        */}
        <p className="text-[12px]/[18px] text-ink-muted">Family only.</p>
      </div>

      {home.afterVisit ? (
        <p className="text-[13px]/[20px] text-ink-body">{home.afterVisit}</p>
      ) : null}

      {notes.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {notes.map((note) => {
            const done = Boolean(note.done) || ticked.includes(note.id);
            return (
              <li key={note.id}>
                <label className="flex cursor-pointer items-start gap-2.5 py-0.5">
                  <input
                    type="checkbox"
                    checked={done}
                    disabled={Boolean(note.done)}
                    onChange={() =>
                      dispatch({ type: "tick", listingId: id, noteId: note.id })
                    }
                    className="mt-[3px] size-[15px] shrink-0 accent-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                  />
                  <span
                    className={cn(
                      "text-[13px]/[19px] transition-colors duration-150 ease-out",
                      done ? "text-ink-faint line-through" : "text-ink",
                    )}
                  >
                    {note.what}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim()) return;
          dispatch({ type: "addNote", listingId: id, what: draft });
          setDraft("");
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Add something to check"
          placeholder="Add something to check"
          className="w-full rounded-lg border border-transparent bg-transparent px-1 py-1 text-[13px]/[19px] text-ink placeholder:text-ink-faint focus-visible:border-hairline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
        />
      </form>
    </section>
  );
}
