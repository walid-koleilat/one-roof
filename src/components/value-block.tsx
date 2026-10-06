import * as React from "react";
import { cn } from "@/lib/utils";
import { StatusChip } from "@/components/status-chip";
import { ConfidenceMeter } from "@/components/confidence-band";
import type { Contributor, ValueBlock as Block } from "@/lib/domain/value-block";
import type { ConfidenceBand } from "@/lib/domain/types";

/**
 * The five-layer figure card: figure, verdict, contributors, comparison,
 * instruction.
 *
 * The instruction is a required field on the model, so this component cannot
 * render a bare number even if someone tries. That is the single most important
 * property of the whole design system - the current product's estimate screen
 * fails precisely because it stops after layer one.
 *
 * Reading order is deliberate and inverted against the usual: verdict first at
 * the top right, figure second, reasons third, instruction last and boxed. A
 * reader in a bad year gets the answer before the arithmetic.
 */

const EFFECT_TONE = {
  helps: "up",
  hurts: "down",
  neutral: "neutral",
} as const;

export function ValueBlockCard({
  block,
  band,
  provenance,
  footer,
  className,
}: {
  block: Block;
  /** Optional confidence, shown beside the verdict when the figure is an estimate. */
  band?: ConfidenceBand;
  /** Slot for a ProvenanceTag. */
  provenance?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      data-slot="value-block"
      className={cn(
        "flex flex-col gap-5 rounded-xl border border-hairline bg-background p-6",
        className,
      )}
    >
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <span className="text-xs font-medium tracking-wide text-ink-muted uppercase">
            {block.label}
          </span>
          <div className="flex items-center gap-2">
            {band ? <ConfidenceMeter band={band} /> : null}
            <StatusChip tone="authority">{block.verdict}</StatusChip>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-number font-semibold tabular-nums text-ink">
            {block.figure}
          </span>
          {provenance}
        </div>

        {block.comparison ? (
          <p className="text-sm text-ink-muted">{block.comparison}</p>
        ) : null}
      </header>

      {block.contributors.length > 0 ? (
        <ul className="flex flex-col gap-2 border-t border-hairline pt-4">
          {block.contributors.map((c) => (
            <ContributorRow key={c.label} contributor={c} />
          ))}
        </ul>
      ) : null}

      <p className="rounded-lg bg-action-tint px-4 py-3 text-sm font-medium text-ink">
        {block.instruction}
      </p>

      {footer}
    </article>
  );
}

function ContributorRow({ contributor }: { contributor: Contributor }) {
  const tone = EFFECT_TONE[contributor.effect ?? "neutral"];
  return (
    <li className="flex items-center justify-between gap-4">
      <span className="text-sm text-ink-body">{contributor.label}</span>
      <StatusChip tone={tone} size="sm" className="tabular-nums">
        {contributor.detail}
      </StatusChip>
    </li>
  );
}
