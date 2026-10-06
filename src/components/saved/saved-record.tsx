"use client";

import { AGENT, type SavedHome } from "@/data/saved";
import { cn } from "@/lib/utils";

/**
 * What happened to a home, in order, and not editable.
 *
 * This is the band that only exists because she saved the house before it
 * happened. A spreadsheet holds an address; it does not notice that 7
 * Galloway went for twelve over on a Monday. Every row is a `HistoryEvent`
 * as the fixture wrote it - the words are never rewritten and the date is
 * the phrase it was given - and the one dot in warm is the fixture's own
 * `notable`, not a guess made here about which row matters.
 *
 * The caption says who else can read it, and on a home the agent is on the
 * answer is that she can. That is deliberate and it is why the record holds
 * only what the market and the calendar did: a viewing she arranged, an
 * offer she wrote, a price the seller changed. What the family thought about
 * any of it is in a lane with its own caption saying the opposite.
 *
 * Nothing anybody said counts as history. The panel says "nothing has
 * happened" for a home with no events even when the family has plenty to
 * say about it.
 */
export function SavedRecord({
  home,
  seated,
}: {
  home: SavedHome;
  /** Whether the agent is on this home, which is what the caption turns on. */
  seated: boolean;
}) {
  if (home.history.length === 0) return null;

  return (
    <section className="flex flex-col gap-2 border-t border-hairline pt-4">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <p className="font-mono text-[11px] tracking-[0.1em] text-ink-muted uppercase">
          What happened
        </p>
        <p className="text-[12px]/[18px] text-ink-muted">
          {seated ? `${AGENT.name} sees this too.` : "Yours and the family's."}
        </p>
      </div>
      <ul className="flex flex-col gap-1.5">
        {home.history.map((event) => (
          <li
            key={event.id}
            className="flex items-baseline justify-between gap-3"
          >
            <span className="flex min-w-0 items-baseline gap-2">
              <span
                aria-hidden
                className={cn(
                  "size-[6px] shrink-0 translate-y-[-2px] rounded-full",
                  event.weight === "notable" ? "bg-warm" : "bg-hairline-strong",
                )}
              />
              <span className="text-[13px]/[19px] text-ink">{event.what}</span>
            </span>
            <span className="shrink-0 text-[12px]/[18px] text-ink-muted">
              {event.when}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
