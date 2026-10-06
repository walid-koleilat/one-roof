import * as React from "react";
import { cn } from "@/lib/utils";
import { BAND_COPY, BAND_ORDER } from "@/lib/domain/confidence";
import type { ConfidenceBand as Band } from "@/lib/domain/types";

/**
 * Confidence, shown rather than hidden.
 *
 * The scale is deliberately never red. Red is the market falling; absent data
 * is not an error and must not be dressed as one. Low confidence is amber and
 * insufficient is grey, so the reader reads "we do not know" instead of
 * "something went wrong".
 *
 * The four bands here match the rules in `assessConfidence`, which is the only
 * place a band is decided. This component never computes one.
 */

const FILL: Record<Band, string> = {
  high: "bg-conf-high",
  moderate: "bg-conf-moderate",
  low: "bg-conf-low",
  insufficient: "bg-conf-none",
};

const TEXT: Record<Band, string> = {
  high: "text-conf-high",
  moderate: "text-conf-moderate",
  low: "text-conf-low",
  insufficient: "text-conf-none",
};

/** How many of the four pips are lit. Insufficient lights none. */
const LIT: Record<Band, number> = {
  high: 4,
  moderate: 3,
  low: 2,
  insufficient: 0,
};

export function ConfidenceMeter({
  band,
  className,
}: {
  band: Band;
  className?: string;
}) {
  const lit = LIT[band];
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${BAND_COPY[band].label}, ${lit} of ${BAND_ORDER.length}`}
    >
      {BAND_ORDER.map((_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            "h-1.5 w-5 rounded-sm transition-colors",
            i < lit ? FILL[band] : "bg-hairline",
          )}
        />
      ))}
    </span>
  );
}

/**
 * The full disclosure: verdict, label, meter, and every reason the band is what
 * it is. The reasons are the product, not debug output, so they render in full
 * and are not collapsed behind a toggle.
 */
export function ConfidenceBand({
  band,
  reasons = [],
  className,
  compact = false,
}: {
  band: Band;
  reasons?: string[];
  className?: string;
  compact?: boolean;
}) {
  const copy = BAND_COPY[band];

  return (
    <section
      data-slot="confidence-band"
      data-band={band}
      className={cn(
        "rounded-lg border border-hairline bg-sunken p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className={cn("text-section font-semibold", TEXT[band])}>
          {copy.verdict}
        </span>
        <ConfidenceMeter band={band} />
        <span className="text-xs text-ink-muted">{copy.label}</span>
      </div>

      <p className="mt-2 text-sm text-ink-body">{copy.blurb}</p>

      {!compact && reasons.length > 0 ? (
        <ul className="mt-3 space-y-1.5 border-t border-hairline pt-3">
          {reasons.map((reason) => (
            <li
              key={reason}
              className="flex gap-2 text-sm text-ink-muted before:mt-2 before:size-1 before:shrink-0 before:rounded-sm before:bg-ink-faint"
            >
              {reason}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
