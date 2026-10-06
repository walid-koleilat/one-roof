"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The entry control, borrowed from Airbnb's search bar.
 *
 * Airbnb's version works because each segment states what it wants in plain
 * words and shows what you have already told it, so the bar doubles as a
 * receipt. Ours asks for the same three things every screen after it depends
 * on: the unit, what it is, and how fast the clock is.
 *
 * What it must never do is ask a fourth question in order to unlock a figure
 * that is free elsewhere on the site.
 */

export interface Segment {
  id: string;
  /** What is being asked. Two or three words. */
  label: string;
  /** The answer so far, or the prompt when empty. */
  value?: string;
  placeholder: string;
  /** The control shown when this segment is open. */
  field: React.ReactNode;
}

export function SegmentedSearch({
  segments,
  action,
  defaultOpenId,
  className,
}: {
  segments: Segment[];
  /** The submit control. Supplied by the caller. */
  action?: React.ReactNode;
  defaultOpenId?: string;
  className?: string;
}) {
  const [openId, setOpenId] = React.useState<string | null>(
    defaultOpenId ?? null,
  );
  const open = segments.find((s) => s.id === openId) ?? null;

  return (
    <div data-slot="segmented-search" className={cn("w-full", className)}>
      <div className="flex flex-col overflow-hidden rounded-xl border border-hairline bg-background shadow-sm sm:flex-row sm:items-stretch sm:rounded-4xl">
        {segments.map((segment, i) => (
          <React.Fragment key={segment.id}>
            {i > 0 ? (
              <span
                aria-hidden
                className="h-px w-full bg-hairline sm:h-auto sm:w-px"
              />
            ) : null}
            <button
              type="button"
              aria-expanded={openId === segment.id}
              aria-controls={`${segment.id}-field`}
              onClick={() =>
                setOpenId((c) => (c === segment.id ? null : segment.id))
              }
              className={cn(
                "flex flex-1 flex-col items-start gap-0.5 px-5 py-3 text-left transition-colors",
                "focus-visible:ring-3 focus-visible:ring-action/40 focus-visible:outline-none",
                openId === segment.id ? "bg-action-tint" : "hover:bg-sunken",
              )}
            >
              <span className="text-xs font-medium tracking-wide text-ink-muted uppercase">
                {segment.label}
              </span>
              <span
                className={cn(
                  "truncate text-sm",
                  segment.value ? "font-medium text-ink" : "text-ink-faint",
                )}
              >
                {segment.value ?? segment.placeholder}
              </span>
            </button>
          </React.Fragment>
        ))}

        {action ? (
          <div className="flex items-center border-t border-hairline p-2 sm:border-t-0 sm:border-l">
            {action}
          </div>
        ) : null}
      </div>

      {open ? (
        <div
          id={`${open.id}-field`}
          className="mt-2 rounded-xl border border-hairline bg-background p-4"
        >
          {open.field}
        </div>
      ) : null}
    </div>
  );
}
