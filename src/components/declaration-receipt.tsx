import * as React from "react";
import { PencilIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusChip } from "@/components/status-chip";
import { summariseDeclaration } from "@/lib/domain/declaration";
import type { Declaration } from "@/lib/domain/types";

/**
 * Agency: what the default assumes, said out loud.
 *
 * Before the user declares anything, the product still has to assume a horizon
 * in order to give advice at all. A product that assumes silently has made the
 * decision on their behalf; one that prints the assumption above the advice,
 * attributed to itself, has handed it back.
 *
 * After they declare, the same component becomes a receipt: what you said, when
 * you said it, what follows from it, and a way to change it. The two states
 * share a layout deliberately, so an assumption never reads as a statement the
 * user made.
 */
export function DeclarationReceipt({
  declaration,
  onChange,
  className,
}: {
  /** Null before the user has declared. That is a real state, not a loading one. */
  declaration: Declaration | null;
  /** The change affordance. Reversibility is a lever, so this is not optional. */
  onChange: React.ReactNode;
  className?: string;
}) {
  const summary = summariseDeclaration(declaration);

  return (
    <aside
      data-slot="declaration-receipt"
      data-assumed={summary.assumed}
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4",
        summary.assumed
          ? "border-warm/40 bg-warm-tint"
          : "border-hairline bg-sunken",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip tone={summary.assumed ? "warm" : "action"} size="sm">
          {summary.assumed ? "Our assumption" : "What you told us"}
        </StatusChip>
        {!summary.assumed ? (
          <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
            <PencilIcon className="size-3" aria-hidden />
            Changeable at any point
          </span>
        ) : null}
      </div>

      <p className="text-sm text-ink-body">{summary.sentence}</p>
      <p className="text-sm text-ink-muted">{summary.consequence}</p>

      <div className="flex flex-wrap gap-2">{onChange}</div>
    </aside>
  );
}
