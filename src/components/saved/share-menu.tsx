"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AGENT, CAST, type Person, type PersonId } from "@/data/saved";
import { cn } from "@/lib/utils";
import { useSaved } from "./saved-provider";

/**
 * Who else can see a collection, and the one thing sharing cannot do.
 *
 * The list is the family and nobody else. It is read off `CAST` by tone
 * rather than typed here, so the agent cannot be added by editing a menu;
 * the reducer refuses her anyway, and this is the second lock on the same
 * door. Ticking a name shares at once. There is no "done" button between
 * her and the change, because the change is the whole dialog.
 *
 * The line at the bottom is the promise the footer makes, said where the
 * decision is made: they see the homes, not her budget, and nothing here
 * reaches an agent.
 */

const FAMILY: readonly Person[] = Object.values(CAST).filter(
  (p) => p.tone === "family",
);

/**
 * The letters on a face. Two where one would be three people - Amma, Appa
 * and Arun all begin with A. Declared against `PersonId`, so a new person
 * in the cast has to be given a face here before anything compiles.
 */
const INITIALS: Record<PersonId, string> = {
  nirosha: "N",
  amma: "Am",
  appa: "Ap",
  arun: "Ar",
  rani: "R",
  anusha: "A",
};

/** Family warm, the agent teal, her own ink. The same rule the thread uses. */
const TONE_BG: Record<Person["tone"], string> = {
  family: "bg-warm",
  agent: "bg-action",
  me: "bg-ink",
};

/**
 * One person as a circle with their initials. Decorative: every caller puts
 * the name in text beside or beneath it, so the circle is hidden from a
 * screen reader rather than read out twice.
 */
export function Face({
  person,
  size = "md",
  className,
}: {
  person: PersonId;
  /** `md` is the header's 30px face; `sm` sits beside a name in a list. */
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        size === "md" ? "size-[30px] text-[12px]" : "size-6 text-[11px]",
        TONE_BG[CAST[person].tone],
        className,
      )}
    >
      {INITIALS[person]}
    </span>
  );
}

export function ShareMenu({
  collectionId,
  open,
  onOpenChange,
}: {
  collectionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { state, dispatch } = useSaved();
  const collection = state.collections.find((c) => c.id === collectionId);
  const sharedWith = collection?.sharedWith ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 p-5 sm:max-w-[380px]">
        <DialogHeader className="gap-1 pr-8">
          <DialogTitle className="text-[17px]/[25px] font-semibold text-ink">
            Share with
          </DialogTitle>
          <DialogDescription className="text-[13px]/[19px] text-ink-muted">
            {collection ? collection.name : "This collection"}. Tick a name
            and they are on it.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col">
          {FAMILY.map((person) => {
            const on = sharedWith.includes(person.id);
            return (
              <li key={person.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1.5 py-2 transition-colors duration-150 ease-out hover:bg-sunken">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() =>
                      dispatch({
                        type: on ? "unshare" : "share",
                        collectionId,
                        person: person.id,
                      })
                    }
                    className="size-4 shrink-0 accent-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                  />
                  <Face person={person.id} size="sm" />
                  <span className="text-[14px]/[20px] text-ink">
                    {person.name}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col gap-1.5 border-t border-hairline pt-3">
          <p className="text-[12px]/[18px] text-ink-muted">
            They see the homes in this collection, they can leave a note, and
            they can add one you have missed. They cannot see your budget or
            your own home.
          </p>
          {/*
            The same sentence as the seat on a home and the line in the
            footer, word for word. An agent is put on one house at a time and
            never on a collection, and this is where somebody would look for
            the exception.
          */}
          <p className="text-[12px]/[18px] text-ink-muted">
            {AGENT.name} is never on a collection. She is put on one home at
            a time, from that home.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
