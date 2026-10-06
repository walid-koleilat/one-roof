"use client";

import * as React from "react";
import { CheckIcon, Undo2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Agency: a choice you can see, and a choice you can take back.
 *
 * Two of the four Agency levers in the brief are about this control. "Whether
 * a choice is visible" means the options stay on screen after you pick one,
 * rather than collapsing into a value that looks like a fact. "Reversibility"
 * means the undo is a first-class control sitting next to the answer, not a
 * back button and a prayer.
 *
 * The consequence line is required. A choice with no stated consequence is a
 * form field, and this product does not ask form questions - it asks the two
 * questions that invert the recommendation, and shows what each answer does.
 */

export interface Choice<T extends string> {
  value: T;
  label: string;
  /** What follows from picking this. Shown once selected, never hidden. */
  consequence: string;
}

export function ChoiceGroup<T extends string>({
  legend,
  choices,
  value,
  onChange,
  onClear,
  className,
}: {
  legend: string;
  choices: ReadonlyArray<Choice<T>>;
  value: T | null;
  onChange: (value: T) => void;
  /** Omit only where unsaying it genuinely makes no sense. */
  onClear?: () => void;
  className?: string;
}) {
  const selected = choices.find((c) => c.value === value) ?? null;

  return (
    <fieldset
      data-slot="choice-group"
      className={cn("flex flex-col gap-3", className)}
    >
      <legend className="text-section font-medium text-ink">{legend}</legend>

      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => {
          const isSelected = choice.value === value;
          return (
            <Button
              key={choice.value}
              type="button"
              variant="outline"
              aria-pressed={isSelected}
              onClick={() => onChange(choice.value)}
              className={cn(
                "h-9 px-3",
                isSelected &&
                  "border-action bg-action-tint text-action-deep hover:bg-action-tint",
              )}
            >
              {isSelected ? <CheckIcon aria-hidden /> : null}
              {choice.label}
            </Button>
          );
        })}
      </div>

      {selected ? (
        <div className="flex flex-col gap-2 rounded-lg bg-sunken px-4 py-3">
          <p className="text-sm text-ink-body">{selected.consequence}</p>
          {onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-action-deep underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-action/40 focus-visible:outline-none"
            >
              <Undo2Icon className="size-3" aria-hidden />
              Unsay this
            </button>
          ) : null}
        </div>
      ) : null}
    </fieldset>
  );
}
