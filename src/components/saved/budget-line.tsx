"use client";

import { useId, useState } from "react";
import { ProvenanceTag } from "@/components/provenance-tag";
import { useSaved } from "@/components/saved/saved-provider";
import {
  budgetLine,
  ceilingLine,
  countAgainst,
  type Ceiling,
} from "@/lib/domain/budget";
import { formatCurrency, formatRange } from "@/lib/domain/format";
import { tilesFor, type SavedList } from "@/lib/domain/saved-view";
import type { Provenance } from "@/lib/domain/provenance";

/**
 * The one line on the page that is about her rather than about a house.
 *
 * Every home in the list is held against the ceiling, and this says how many
 * are inside, how many turn on what her semi fetches, and how many are over.
 * A home at stage `gone` is somebody else's now and is left out, because
 * "none of the eight you can still buy" has to mean the eight she can still
 * buy.
 *
 * It used to be a grey box with three things in it: the sentence, the
 * ceiling written out with a disclaimer, and a line saying Arun could see
 * this and nothing else. All three were true and the box was the second
 * thing on the page, above the houses, which made her money the subject of a
 * screen about her parents. It is a sentence now, with the working-out
 * behind a link, and what Arun can see is said where sharing is decided.
 *
 * The rule it still carries is that a number arrives with what it rests on.
 * The ceiling is two figures with "to" between them, never a midpoint, and
 * the disclosure lists every input with its own provenance attached, so an
 * invented figure says it is invented wherever it is drawn.
 */

/** A row in the disclosure, after the bracket's two ends have been joined. */
interface RestRow {
  key: string;
  label: string;
  value: string;
  provenance: Provenance;
}

/**
 * The bracket arrives as two clauses sharing a label, low end first, and the
 * domain asks the renderer to draw them as one row with "to" between. Every
 * other clause is one row as it stands. The provenance on the joined row is
 * the low end's; the high end names the same source in the same words.
 */
function restRows(ceiling: Ceiling): readonly RestRow[] {
  const bracket = ceiling.rests.filter((r) => r.sign === "bracket");
  const low = bracket[0];
  const high = bracket[1];
  const rows: RestRow[] = [];
  let bracketDrawn = false;

  for (const rest of ceiling.rests) {
    if (rest.sign === "bracket") {
      if (bracketDrawn) continue;
      bracketDrawn = true;
      if (low && high && bracket.length === 2) {
        rows.push({
          key: "bracket",
          label: low.label,
          value: formatRange(low.value.value, high.value.value),
          provenance: low.value.provenance,
        });
        continue;
      }
      // Not the pair the domain promised. Show each end on its own rather
      // than one of them dressed as the whole bracket.
      bracket.forEach((end, i) => {
        rows.push({
          key: `bracket-${i}`,
          label: end.label,
          value: formatCurrency(end.value.value),
          provenance: end.value.provenance,
        });
      });
      continue;
    }
    rows.push({
      key: `${rest.sign}-${rest.label}`,
      label: rest.label,
      value: formatCurrency(rest.value.value),
      provenance: rest.value.provenance,
    });
  }
  return rows;
}

export function BudgetLine({ list }: { list: SavedList }) {
  const { state, world, ceiling } = useSaved();
  const [open, setOpen] = useState(false);
  const restsId = useId();

  const buyable = tilesFor(list, world, state)
    .filter((t) => t.stage !== "gone")
    .map((t) => t.listing);
  const count = countAgainst(buyable, ceiling);
  const rows = restRows(ceiling);

  return (
    <section aria-label="Your ceiling" className="flex flex-col gap-1.5">
      <p className="text-[17px]/[25px] text-ink">
        {budgetLine(count, ceiling)}{" "}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={restsId}
          onClick={() => setOpen((o) => !o)}
          className="rounded-sm text-[15px]/[22px] font-medium text-ink-muted underline underline-offset-2 outline-none ease-out hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action motion-safe:transition-colors motion-safe:duration-150"
        >
          What it rests on
        </button>
      </p>

      {open ? (
        <div
          id={restsId}
          className="flex flex-col gap-2 rounded-xl bg-sunken px-4 py-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-250 motion-safe:ease-out"
        >
          <p className="text-[13px]/[20px] text-ink-muted">
            {ceilingLine(ceiling)}
          </p>
          <ul className="flex flex-col">
            {rows.map((row) => (
              <li
                key={row.key}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-hairline py-2 first:border-t-0"
              >
                <span className="text-[13px]/[19px] text-ink-body">
                  {row.label}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-[13px]/[19px] font-semibold text-ink tabular-nums">
                    {row.value}
                  </span>
                  <ProvenanceTag provenance={row.provenance} size="sm" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
