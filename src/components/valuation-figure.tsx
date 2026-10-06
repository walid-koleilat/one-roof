import * as React from "react";
import { cn } from "@/lib/utils";
import { ConfidenceBand, ConfidenceMeter } from "@/components/confidence-band";
import { StatusChip } from "@/components/status-chip";
import { BAND_COPY } from "@/lib/domain/confidence";
import {
  disclosureCaption,
  disclosureFigure,
  discloseValuation,
} from "@/lib/domain/disclosure";
import type { Valuation } from "@/lib/domain/types";

/**
 * The valuation, shown at whatever precision it has actually earned.
 *
 * This takes a `Valuation` rather than a formatted string, which is the whole
 * point: the component asks the domain layer what it is allowed to show and
 * has no prop for overriding the answer. A midpoint cannot reach the screen
 * from an `insufficient` band, because there is no code path from one to the
 * other.
 *
 * Three renderings, in descending confidence: a figure with its bracket, a
 * bracket alone, and a refusal. The refusal is a designed state, not an error
 * state - it gets the same weight and the same layout as the other two.
 */
export function ValuationFigure({
  valuation,
  label = "Estimated value",
  provenance,
  className,
}: {
  valuation: Valuation;
  label?: string;
  /** Slot for a ProvenanceTag. */
  provenance?: React.ReactNode;
  className?: string;
}) {
  const disclosure = discloseValuation(valuation);
  const figure = disclosureFigure(disclosure);
  const caption = disclosureCaption(disclosure);

  return (
    <section
      data-slot="valuation-figure"
      data-disclosure={disclosure.kind}
      className={cn("flex flex-col gap-4", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-medium tracking-wide text-ink-muted uppercase">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <ConfidenceMeter band={valuation.band} />
          <StatusChip tone="authority" size="sm">
            {BAND_COPY[valuation.band].verdict}
          </StatusChip>
        </div>
      </div>

      {figure ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline gap-3">
            <span
              className={cn(
                "font-semibold tabular-nums text-ink",
                disclosure.kind === "point" ? "text-number" : "text-display",
              )}
            >
              {figure}
            </span>
            {provenance}
          </div>
          {caption ? (
            <p className="max-w-prose text-sm text-ink-muted">{caption}</p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-title font-semibold text-balance text-ink">
            We are not going to give you a number for this one.
          </p>
          <p className="max-w-prose text-sm text-ink-muted">
            {disclosure.kind === "withheld" ? disclosure.reason : null}
          </p>
        </div>
      )}

      <ConfidenceBand band={valuation.band} reasons={valuation.reasons} />
    </section>
  );
}
