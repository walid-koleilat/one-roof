import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The three shapes a turn takes inside the host product: the user's bubble,
 * the assistant's prose, and the citation chips under a claim.
 *
 * They are typed as data rather than composed as JSX at the call site so the
 * transcript in `src/data/` stays readable as a transcript. Someone reviewing
 * whether the assistant oversteps VOW Rule 8.18 should be able to read the
 * conversation without reading a component tree.
 */

export function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] rounded-[22px] bg-gpt-bubble px-3.5 py-2.5 text-[15px]/[23px] text-gpt-ink sm:max-w-[70%] sm:px-4 sm:text-base/6">
        {children}
      </p>
    </div>
  );
}

export function AssistantProse({
  paragraphs,
  className,
}: {
  paragraphs: readonly string[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/*
        Keyed by position, not by text. While an answer is streaming the last
        paragraph changes on every frame, and keying by content would unmount
        and remount it each time - which reads as a flicker rather than as
        words being written.
      */}
      {paragraphs.map((text, i) => (
        <p key={i} className="text-[15px]/[24px] text-gpt-ink sm:text-base/[26px]">
          {text}
        </p>
      ))}
    </div>
  );
}

export function AssistantList({
  lead,
  items,
}: {
  lead: string;
  items: readonly string[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[15px]/[24px] text-gpt-ink sm:text-base/[26px]">{lead}</p>
      <ul className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-[15px]/[24px] text-gpt-ink sm:text-base/[26px]">
            <span aria-hidden className="shrink-0">
              &bull;
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Where a claim came from.
 *
 * These are the only things on the screen that make One Roof the source of
 * an answer rather than the seller of an ad, so they sit under the paragraph
 * they support and not in a footnote nobody reads.
 */
export function SourceChips({ sources }: { sources: readonly string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sources.map((source) => (
        <span
          key={source}
          className="rounded-md bg-gpt-bubble px-2 py-1 text-[11px]/4 text-gpt-muted"
        >
          {source}
        </span>
      ))}
    </div>
  );
}

/** The grey squares that stand in for the response toolbar. Scenery. */
export function TurnActions() {
  return (
    <div aria-hidden className="flex items-center gap-[18px] pt-0.5">
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className="size-3.5 rounded bg-hairline-strong" />
      ))}
    </div>
  );
}
