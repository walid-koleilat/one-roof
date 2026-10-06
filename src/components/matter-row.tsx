import type { Matter, MatterTone } from "@/lib/domain/matters";
import { cn } from "@/lib/utils";

/**
 * The tick or the dash, on its own.
 *
 * Shared with the evidence block and the rail beside the map, so the mark
 * that means "cleared" is the same shape in every place a claim is judged.
 * The dash has square ends: it is a bar, not a rounded pill, because a house
 * that misses a line by two minutes has not failed an exam and the mark
 * should read as a measurement rather than a badge.
 */
export function MatterMark({ tone }: { tone: MatterTone }) {
  if (tone === "met") {
    return (
      <svg width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden>
        <path
          d="M1 5L4.6 8.6L12 1.2"
          stroke="var(--ds-action-deep)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // The same 10px box the tick draws in, with the bar centred inside it,
  // so both marks sit on the same line of the text beside them.
  return (
    <span aria-hidden className="flex h-[10px] w-[13px] items-center">
      <span
        className={cn(
          "block h-[2px] w-full",
          tone === "unmet" ? "bg-conf-low" : "bg-ink-faint",
        )}
      />
    </span>
  );
}

/**
 * One line of her list: a tick or a dash, the claim, and where there is one,
 * the measurement beside the number she set.
 *
 * The claim she cannot check from the street is the only one that carries a
 * thumbnail, and pressing it swaps the card's photograph for the evidence. The
 * two she can check carry the measurement, and nothing else.
 *
 * The two marks are not the same shape on purpose. A tick is a mark somebody
 * makes; the dash is a bar rather than a cross, because a house that misses a
 * line by two minutes has not failed an exam.
 *
 * The two proof buttons carry a z-index. On a card that can be picked, the
 * address button stretches a pseudo-element over the whole card, and anything
 * without a stacking position paints underneath it - which left the one row
 * she cannot check from the street unpressable on the one page that has it.
 */
export function MatterRow({
  matter,
  onProof,
  valueAt = "inline",
  /**
   * Rendered hard right, after everything else on the row.
   *
   * The results card puts its price here rather than on a line of its own,
   * which is the only reason this exists. A price on its own line would take
   * a fifth of a 196px card to say a thing that fits in the gap.
   */
  trailing,
  /** "md" is the agent card: 14px rows, 9px gap, and ink for what cleared. */
  size = "sm",
}: {
  matter: Matter;
  onProof?: () => void;
  size?: "sm" | "md";
  /**
   * Where the figure sits. Beside the words on a listing, where "Hospital
   * 8 min" is one phrase; in its own lane on an agent, where three numbers
   * are being compared down a column and have to line up.
   */
  valueAt?: "inline" | "end";
  trailing?: React.ReactNode;
}) {
  const unmet = matter.tone === "unmet";
  const md = size === "md";
  const text = md ? "text-sm/[21px]" : "text-[13px]/5";
  return (
    <li
      className={cn(
        "flex",
        md ? "items-center gap-[9px]" : trailing ? "items-center gap-2" : "items-start gap-2",
      )}
    >
      <span aria-hidden className={cn("shrink-0", !trailing && !md && "mt-[3px]")}>
        <MatterMark tone={matter.tone} />
      </span>

      {onProof ? (
        <button
          type="button"
          onClick={onProof}
          className={cn(
            "relative z-20 min-w-0 text-left text-ink underline decoration-1 underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action",
            text,
          )}
        >
          {matter.label}
        </button>
      ) : (
        <span
          className={cn("min-w-0", text, unmet ? "text-conf-low" : "text-ink")}
        >
          {matter.label}
          {matter.value && valueAt === "inline" ? (
            <span className="font-semibold"> {matter.value}</span>
          ) : null}
        </span>
      )}

      {/*
        Her number, not ours. Smaller and quieter than the one we measured,
        because the row is a comparison and the reader should land on the
        measurement first and the line it cleared second.
      */}
      {matter.against && valueAt === "inline" ? (
        <span
          className={cn(
            "shrink-0 text-xs/5",
            unmet ? "text-conf-low" : "text-ink-muted",
          )}
        >
          {matter.against}
        </span>
      ) : null}

      {onProof && matter.proof ? (
        <button
          type="button"
          onClick={onProof}
          aria-label={`Show ${matter.proof.caption}`}
          style={{ backgroundImage: `url(${matter.proof.photo})` }}
          className="relative z-20 h-5 w-7 shrink-0 rounded-[3px] bg-cover bg-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
        />
      ) : null}

      {matter.value && valueAt === "end" ? (
        <span
          className={cn(
            "ml-auto shrink-0 font-semibold",
            md ? "text-sm/[21px]" : "text-[13px]/[18px]",
            unmet ? "text-conf-low" : md ? "text-ink" : "text-ink-body",
          )}
        >
          {matter.value}
        </span>
      ) : null}

      {trailing ? <span className="ml-auto shrink-0">{trailing}</span> : null}
    </li>
  );
}
