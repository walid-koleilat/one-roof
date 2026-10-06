import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * The one chip in the system.
 *
 * The live site ships at least four visually distinct pill treatments for what
 * is functionally the same object, which is how you end up with two oranges.
 * Everything small, coloured and rounded in this prototype is this component
 * with a different tone.
 *
 * Tone is semantic, never decorative. `up` and `down` mean the market moved;
 * they do not mean good and bad. A 26.9% fall is `down` whether the reader is
 * buying or selling, and the surrounding copy says which it is.
 */
const chip = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap [&>svg]:size-3 [&>svg]:shrink-0",
  {
    variants: {
      tone: {
        action: "bg-action-tint text-action-deep",
        authority: "bg-authority-tint text-authority",
        warm: "bg-warm-tint text-warm",
        up: "bg-up/10 text-up",
        down: "bg-down/10 text-down",
        neutral: "bg-sunken text-ink-muted",
        /*
         * A comparison that landed on the line: the delta chip's "At estimate".
         * One step firmer than `neutral` on both fill and ink, because it sits
         * on a card beside a teal or warm sibling and the sunken grey read as
         * missing there. The fill has no token - the board draws #EFF1F1 and
         * nothing else in the system uses it - so it is written out here
         * rather than minted as a token for one chip.
         */
        flat: "bg-[#EFF1F1] text-ink-prose",
        outline: "border border-hairline bg-transparent text-ink-muted",
      },
      size: {
        sm: "h-5 text-[0.6875rem]",
        md: "h-6 text-xs",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export type ChipTone = NonNullable<VariantProps<typeof chip>["tone"]>;

export function StatusChip({
  className,
  tone,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof chip>) {
  return (
    <span
      data-slot="status-chip"
      data-tone={tone ?? "neutral"}
      className={cn(chip({ tone, size }), className)}
      {...props}
    />
  );
}
