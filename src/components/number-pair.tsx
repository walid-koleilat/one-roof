import * as React from "react";
import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusChip, type ChipTone } from "@/components/status-chip";
import type { Direction, Verdict } from "@/lib/domain/signal";

/**
 * A figure and the thing that makes it mean something.
 *
 * No figure in this product ships alone. A reader shown "$651,648" with no
 * baseline invents one, and the one they invent is what they paid in 2022.
 * The verdict line is the point of the component; the figure is the setup.
 *
 * The verdict is computed in `src/lib/domain/signal.ts`. This renders it.
 */

const ARROW: Record<Direction, React.ComponentType<{ className?: string }>> = {
  up: ArrowUpRightIcon,
  down: ArrowDownRightIcon,
  flat: ArrowRightIcon,
};

/**
 * Colour is reserved for comparisons where one direction is actually better.
 * A neutral comparison stays grey however large the gap, because green on
 * "19% above the 905 average" reads as good news and it is not news at all.
 */
function toneFor(v: Verdict): ChipTone {
  if (v.polarity === "neutral" || v.direction === "flat") return "neutral";
  return v.standing === "better" ? "up" : "down";
}

export function NumberPair({
  label,
  figure,
  verdict,
  caption,
  size = "md",
  align = "start",
  className,
  children,
}: {
  label: string;
  /** Already formatted. Precision is decided in the domain layer. */
  figure: React.ReactNode;
  /** Null when there is honestly nothing to compare against. */
  verdict?: Verdict | null;
  /** Optional line under the verdict - the source, the date, the caveat. */
  caption?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  align?: "start" | "end";
  className?: string;
  /** Slot for a provenance tag, sitting beside the label. */
  children?: React.ReactNode;
}) {
  const Arrow = verdict ? ARROW[verdict.direction] : null;

  return (
    <div
      data-slot="number-pair"
      className={cn(
        "flex flex-col gap-1",
        align === "end" && "items-end text-right",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium tracking-wide text-ink-muted uppercase">
          {label}
        </span>
        {children}
      </div>

      <span
        className={cn(
          "font-semibold tabular-nums text-ink",
          size === "lg" && "text-number",
          size === "md" && "text-display",
          size === "sm" && "text-title",
        )}
      >
        {figure}
      </span>

      {verdict ? (
        <StatusChip tone={toneFor(verdict)} size="sm" className="mt-0.5">
          {Arrow ? <Arrow aria-hidden /> : null}
          {verdict.sentence}
        </StatusChip>
      ) : null}

      {caption ? (
        <span className="text-xs text-ink-muted">{caption}</span>
      ) : null}
    </div>
  );
}
