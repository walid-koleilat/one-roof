import * as React from "react";
import { cn } from "@/lib/utils";
import { StatusChip } from "@/components/status-chip";

/**
 * The assistant's turn, shaped so it cannot be written wrong.
 *
 * The project rule is that the assistant opens with a position, not a greeting,
 * states what it knows with its sources, then names the condition that flips
 * the answer. Both `position` and `condition` are required props. There is no
 * prop for a greeting, and adding one would be a change to the product, not to
 * a component.
 *
 * `question` is optional and deliberately awkward to fill in: if a question
 * would not change the output, it is a lead-form question and it does not get
 * asked.
 */

export function AssistantMessage({
  position,
  basis,
  condition,
  question,
  actions,
  className,
}: {
  /** The claim, first. One or two sentences. */
  position: React.ReactNode;
  /** The sourced support. Put SourcedNumber or SourcedStat in here. */
  basis?: React.ReactNode;
  /** What would change the answer. Required - an unqualified position is a guess. */
  condition: React.ReactNode;
  /** Only asked when the answer depends on it. */
  question?: React.ReactNode;
  /** Choice buttons, supplied by the caller so this stays a server component. */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="assistant-message"
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-hairline bg-background p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        <StatusChip tone="authority" size="sm" className="uppercase">
          What we think
        </StatusChip>
        <p className="text-lede text-balance text-ink">{position}</p>
      </div>

      {basis ? (
        <div className="flex flex-col gap-3 border-t border-hairline pt-4">
          {basis}
        </div>
      ) : null}

      <p className="border-l-2 border-warm bg-warm-tint px-4 py-3 text-sm text-ink-body">
        <span className="font-medium text-ink">This changes if: </span>
        {condition}
      </p>

      {question ? (
        <div className="flex flex-col gap-3 border-t border-hairline pt-4">
          <p className="text-section font-medium text-ink">{question}</p>
          {actions ? (
            <div className="flex flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>
      ) : (
        actions
      )}
    </div>
  );
}
