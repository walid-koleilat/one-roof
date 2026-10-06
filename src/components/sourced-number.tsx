import * as React from "react";
import { cn } from "@/lib/utils";
import { ProvenanceTag } from "@/components/provenance-tag";
import { NumberPair } from "@/components/number-pair";
import type { Sourced } from "@/lib/domain/provenance";
import { verdictFor, type NumberPair as Pair } from "@/lib/domain/signal";

/**
 * The narrow gate every figure passes through.
 *
 * It takes `Sourced<number>` rather than `number`, so a component cannot put a
 * figure on screen without having decided where it came from. That is the
 * whole design: provenance is a type error, not a code review comment.
 */

export function SourcedNumber({
  value,
  format,
  className,
  showProvenance = true,
}: {
  value: Sourced<number>;
  format: (n: number) => string;
  className?: string;
  showProvenance?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className="tabular-nums">{format(value.value)}</span>
      {showProvenance ? (
        <ProvenanceTag provenance={value.provenance} />
      ) : null}
    </span>
  );
}

/**
 * A sourced figure with its baseline and its verdict - the full "so what".
 * Prefer this over `SourcedNumber` anywhere the reader has to make a decision.
 */
export function SourcedStat({
  label,
  value,
  format,
  baseline,
  polarity,
  unit,
  caption,
  size,
  className,
}: {
  label: string;
  value: Sourced<number>;
  format: (n: number) => string;
  baseline?: { label: string; value: number };
  polarity?: Pair["polarity"];
  unit?: Pair["unit"];
  caption?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const verdict = verdictFor({
    label,
    value: value.value,
    ...(baseline ? { baseline } : {}),
    ...(polarity !== undefined ? { polarity } : {}),
    ...(unit !== undefined ? { unit } : {}),
  });

  return (
    <NumberPair
      label={label}
      figure={format(value.value)}
      verdict={verdict}
      {...(caption !== undefined ? { caption } : {})}
      {...(size !== undefined ? { size } : {})}
      {...(className !== undefined ? { className } : {})}
    >
      <ProvenanceTag provenance={value.provenance} />
    </NumberPair>
  );
}
