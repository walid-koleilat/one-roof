import * as React from "react";
import { InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusChip } from "@/components/status-chip";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  needsCaveat,
  provenanceLabel,
  type Provenance,
} from "@/lib/domain/provenance";

/**
 * Where a figure came from, rendered next to the figure.
 *
 * Published sources get a quiet grey tag, because "TRREB, 2026-08" is a
 * credential rather than a warning. Derived and mock figures get the warm tone
 * and a tooltip carrying the method, because the brief requires the cohort
 * series to say out loud that it was read off chart geometry.
 */
export function ProvenanceTag({
  provenance,
  className,
  size = "sm",
}: {
  provenance: Provenance;
  className?: string;
  size?: "sm" | "md";
}) {
  const caveat = needsCaveat(provenance);
  const label = provenanceLabel(provenance);
  const detail = explain(provenance);

  const chip = (
    <StatusChip
      tone={caveat ? "warm" : "outline"}
      size={size}
      className={cn(caveat && "cursor-help", className)}
    >
      {caveat ? <InfoIcon aria-hidden /> : null}
      {label}
    </StatusChip>
  );

  if (!detail) return chip;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{chip}</TooltipTrigger>
      <TooltipContent className="max-w-72 text-pretty">{detail}</TooltipContent>
    </Tooltip>
  );
}

function explain(p: Provenance): string | null {
  switch (p.kind) {
    case "published":
      return p.url ? `Published by ${p.source}. Source: ${p.url}` : null;
    case "derived":
      return `Not a published figure. ${p.method}, from ${p.source} (${p.asOf}). Treat it as an indication of scale, not a quotable number.`;
    case "computed":
      return `Calculated here from ${p.from.join(" and ")}. No new data went into it.`;
    case "mock":
      return `Invented for this prototype. ${p.note}`;
  }
}
