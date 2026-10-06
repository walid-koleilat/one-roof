"use client";

import { useSaved } from "@/components/saved/saved-provider";
import { stagePillsFor, type SavedList } from "@/lib/domain/saved-view";
import { cn } from "@/lib/utils";

/**
 * Where each home in this list has got to, as a row of pills over the grid.
 *
 * This used to be a section of the rail, five rows deep, sitting under the
 * collections and looking exactly like them. It was a filter dressed as a
 * container: pressing *Visited* left whichever collection she was in, and the two
 * questions she actually asks - which of these have I seen, and which of the
 * ones Appa can manage have I seen - could not both be asked. As a row over
 * the grid it scopes to the open list, and both can.
 *
 * Every stage is drawn, empty ones included, so the row has the same shape
 * on every list and an empty stage reads as a fact rather than a gap. The
 * counts come from `stagePillsFor` against the list that is open, which is
 * why the numbers change when she moves between collections and why no component
 * has to be told they did.
 */
export function StagePills({ list }: { list: SavedList }) {
  const { state, dispatch, world } = useSaved();
  const pills = stagePillsFor(list, world, state);

  return (
    <div
      role="group"
      aria-label="Where they are up to"
      className="flex gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {pills.map((pill) => {
        const on = state.stageFilter === pill.stage;
        const empty = pill.count === 0;
        return (
          <button
            key={pill.stage ?? "all"}
            type="button"
            aria-pressed={on}
            // An empty stage is still drawn, and still says its count. It is
            // not pressable, because a filter that empties the grid is a
            // question already answered by the zero beside its name.
            disabled={empty}
            onClick={() => dispatch({ type: "filterStage", stage: pill.stage })}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px]/[19px] font-medium whitespace-nowrap ease-out outline-none motion-safe:transition-colors motion-safe:duration-150",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action",
              on
                ? "border-ink bg-ink text-white"
                : empty
                  ? "border-hairline text-ink-faint"
                  : "border-hairline text-ink-body hover:border-hairline-strong hover:bg-sunken",
            )}
          >
            {pill.label}
            <span
              className={cn(
                "tabular-nums",
                on ? "text-white/70" : empty ? "text-ink-faint" : "text-ink-muted",
              )}
            >
              {pill.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
