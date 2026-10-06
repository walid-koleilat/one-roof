"use client";

import { useId, useState } from "react";
import { useSaved } from "@/components/saved/saved-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listsFor } from "@/lib/domain/saved-view";

/**
 * Which collections a home sits in, and the one place that changes it.
 *
 * Photos calls this "Add to Album", and that is the whole model. A home can
 * sit in several collections at once, and filing it in one never takes it
 * out of Saved listings. Ticking one files the home there and then; there is
 * no "done" between her and the change, because the change is the dialog.
 * Naming a new collection files the home in it in the same act, and the reducer
 * takes her to it, since she just made it and expects to be looking at it.
 *
 * The rule it carries is that nothing here counts or remembers. The names,
 * who each collection is shared with and how many homes it holds come from
 * `listsFor`; whether this home is in one is read off the collection itself.
 * A blank name is a no-op in the reducer and the button is held back until
 * there is one, so there is never an untitled collection.
 */
export function CollectionMenu({
  listingId,
  open,
  onOpenChange,
}: {
  listingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { state, world, dispatch } = useSaved();
  const [name, setName] = useState("");
  const inputId = useId();
  const lists = listsFor("collections", world, state);
  const trimmed = name.trim();

  const make = () => {
    if (trimmed === "") return;
    dispatch({
      type: "newCollection",
      name: trimmed,
      madeOn: "Today",
      firstListingId: listingId,
    });
    setName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 p-5 sm:max-w-[380px]">
        <DialogHeader className="gap-1 pr-8">
          <DialogTitle className="text-[17px]/[25px] font-semibold text-ink">
            Save in
          </DialogTitle>
          <DialogDescription className="text-[13px]/[19px] text-ink-muted">
            Tick one and it is filed. It stays in your saved homes whatever
            you do here.
          </DialogDescription>
        </DialogHeader>

        {lists.length > 0 ? (
          <ul className="flex flex-col">
            {lists.map((list) => {
              const collection = state.collections.find((c) => c.id === list.id);
              const on = collection?.homeIds.includes(listingId) ?? false;
              return (
                <li key={list.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1.5 py-2 transition-colors duration-150 ease-out hover:bg-sunken">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        dispatch({
                          type: on ? "uncollect" : "collect",
                          collectionId: list.id,
                          listingId,
                        })
                      }
                      className="size-4 shrink-0 accent-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                    />
                    <span className="flex min-w-0 grow flex-col">
                      <span className="truncate text-[14px]/[20px] text-ink">
                        {list.name}
                      </span>
                      <span className="text-[12px]/[18px] text-ink-muted">
                        {list.meta}
                      </span>
                    </span>
                    <span className="w-[26px] shrink-0 text-right text-[13px]/[19px] text-ink-muted tabular-nums">
                      {list.homeIds.length}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-[13px]/[19px] text-ink-muted">
            No collections yet. Name one below and this home goes in it.
          </p>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            make();
          }}
          className="flex flex-col gap-2 border-t border-hairline pt-4"
        >
          <label
            htmlFor={inputId}
            className="font-mono text-[10px] tracking-[0.1em] text-ink-faint uppercase"
          >
            New collection
          </label>
          <div className="flex items-center gap-2">
            <input
              id={inputId}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="A name for it"
              autoComplete="off"
              className="min-w-0 grow rounded-lg border border-hairline-strong bg-background px-3 py-2 text-[14px]/[20px] text-ink outline-none placeholder:text-ink-faint focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
            />
            <button
              type="submit"
              disabled={trimmed === ""}
              className="shrink-0 rounded-full bg-ink px-4 py-2 text-[13px]/[19px] font-semibold text-white transition-opacity duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action disabled:opacity-40"
            >
              Make it
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
