"use client";

import * as React from "react";
import { BuildingIcon, MapPinIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusChip } from "@/components/status-chip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  formatCount,
  formatCurrency,
  formatDate,
  formatSignedCurrency,
} from "@/lib/domain/format";
import type { Comparable } from "@/lib/domain/types";

/**
 * The comps, with the adjustments shown.
 *
 * The brief's complaint about the current estimate is that it arrives with no
 * comps and no explanation. Showing the comps is table stakes; showing the
 * signed adjustments applied to each one is what makes the range survive a
 * conversation with a lawyer, and it is the part every competitor hides.
 *
 * Rows stack on mobile and align into columns from `sm` up. No horizontal
 * scroll: a table you have to swipe sideways is a table nobody reads.
 */

export function CompTable({
  comparables,
  className,
}: {
  comparables: Comparable[];
  className?: string;
}) {
  if (comparables.length === 0) {
    return (
      <p
        data-slot="comp-table-empty"
        className="rounded-lg border border-dashed border-hairline-strong bg-sunken p-6 text-sm text-ink-muted"
      >
        No comparable sales for this unit type in this building or nearby. That
        is the finding, not a loading state.
      </p>
    );
  }

  return (
    <Accordion
      type="multiple"
      data-slot="comp-table"
      className={cn(
        "overflow-hidden rounded-lg border border-hairline",
        className,
      )}
    >
      {comparables.map((comp) => (
        <CompRow key={comp.id} comparable={comp} />
      ))}
    </Accordion>
  );
}

function CompRow({ comparable }: { comparable: Comparable }) {
  const net = comparable.adjustments.reduce((sum, a) => sum + a.amount, 0);

  return (
    <AccordionItem value={comparable.id} className="border-hairline">
      <AccordionTrigger className="gap-4 px-4 py-3 hover:bg-sunken">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            {comparable.sameBuilding ? (
              <BuildingIcon className="size-4 shrink-0 text-action" aria-hidden />
            ) : (
              <MapPinIcon className="size-4 shrink-0 text-ink-faint" aria-hidden />
            )}
            <span className="truncate text-sm font-medium text-ink">
              {comparable.address}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-3 text-sm">
            <span className="text-ink-muted">
              {formatCount(comparable.sqft)} sq ft
            </span>
            <span className="font-semibold tabular-nums text-ink">
              {formatCurrency(comparable.soldPrice)}
            </span>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="bg-sunken px-4 pb-4">
        <div className="flex flex-wrap items-center gap-2 pb-3">
          <StatusChip tone="neutral" size="sm">
            Sold {formatDate(comparable.soldOn)}
          </StatusChip>
          <StatusChip
            tone={comparable.sameBuilding ? "action" : "outline"}
            size="sm"
          >
            {comparable.sameBuilding ? "Same building" : "Nearby building"}
          </StatusChip>
        </div>

        {comparable.adjustments.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No adjustments. This unit is close enough to yours to compare
            directly.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5 border-t border-hairline pt-3">
            {comparable.adjustments.map((a) => (
              <li
                key={a.reason}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <span className="text-ink-body">{a.reason}</span>
                <span
                  className={cn(
                    "shrink-0 tabular-nums",
                    a.amount > 0 ? "text-up" : a.amount < 0 ? "text-down" : "text-ink-muted",
                  )}
                >
                  {formatSignedCurrency(a.amount)}
                </span>
              </li>
            ))}
            <li className="mt-1 flex items-center justify-between gap-4 border-t border-hairline pt-2 text-sm font-medium">
              <span className="text-ink">Adjusted to your unit</span>
              <span className="shrink-0 tabular-nums text-ink">
                {formatCurrency(comparable.soldPrice + net)}
              </span>
            </li>
          </ul>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
