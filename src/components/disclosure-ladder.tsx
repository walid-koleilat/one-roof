"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * Progressive disclosure, borrowed from Airbnb's listing page: a claim, then
 * the evidence for the claim one tap down, then the raw material one tap
 * further. Nobody is forced through all three, and nobody is prevented from
 * reaching the bottom.
 *
 * The distinction that matters here: this ladder discloses *depth*, never
 * *access*. Qualification does not gate data that is free today - that is the
 * most-complained-about thing in the current product and the one pattern this
 * component must never be used to build.
 */

export interface Rung {
  id: string;
  /** The claim. Readable on its own. */
  title: string;
  /** One line saying what is underneath, so opening it is an informed choice. */
  teaser?: string;
  content: React.ReactNode;
}

export function DisclosureLadder({
  rungs,
  defaultOpen = [],
  className,
}: {
  rungs: Rung[];
  defaultOpen?: string[];
  className?: string;
}) {
  return (
    <Accordion
      type="multiple"
      defaultValue={defaultOpen}
      data-slot="disclosure-ladder"
      className={cn(
        "overflow-hidden rounded-lg border border-hairline",
        className,
      )}
    >
      {rungs.map((rung, i) => (
        <AccordionItem
          key={rung.id}
          value={rung.id}
          className="border-hairline"
        >
          <AccordionTrigger className="gap-4 px-4 py-3 hover:bg-sunken">
            <span className="flex min-w-0 items-start gap-3 text-left">
              <span
                aria-hidden
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm bg-sunken text-[0.6875rem] font-medium tabular-nums text-ink-muted"
              >
                {i + 1}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium text-ink">
                  {rung.title}
                </span>
                {rung.teaser ? (
                  <span className="text-xs text-ink-muted">{rung.teaser}</span>
                ) : null}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 text-sm text-ink-body">
            {rung.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
