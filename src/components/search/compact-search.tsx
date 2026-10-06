"use client";

import { HouseIcon, SearchIcon } from "@/components/search/search-bar";
import { cn } from "@/lib/utils";

/**
 * The search bar, shrunk to a pill once it has scrolled away.
 *
 * She should never lose sight of what she is searching for, and she should
 * never have to scroll back up to change it. When the full bar leaves the
 * top of the window this takes its place in the sticky header: the three
 * values in one line, with the mark and the magnifier, and pressing it drops
 * the full bar back down over the page where she is.
 */
export function CompactSearch({
  looking,
  where,
  budget,
  onOpen,
}: {
  looking: string;
  where: string;
  budget: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Change what you are searching for"
      className="flex max-w-full items-center gap-1 rounded-full border border-hairline-strong bg-background py-1.5 pr-1.5 pl-2 text-left shadow-[0_3px_10px_rgba(22,24,26,0.10)] transition-shadow hover:shadow-[0_4px_14px_rgba(22,24,26,0.16)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
    >
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-action-tint text-action-deep"
      >
        <HouseIcon />
      </span>
      {/*
        On a phone the pill has room for two of the three, and the two she
        would change are the area and the budget; what she is looking for is
        the heading above. Three truncated stubs said nothing legible.
      */}
      <Part className="hidden sm:inline">{looking}</Part>
      <Rule className="hidden sm:block" />
      <Part>{where}</Part>
      <Rule />
      <Part>{budget}</Part>
      <span
        aria-hidden
        className="ml-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-action text-white"
      >
        <SearchIcon />
      </span>
    </button>
  );
}

function Part({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("min-w-0 truncate px-2.5 text-sm/5 font-medium text-ink", className)}>
      {children}
    </span>
  );
}

function Rule({ className }: { className?: string }) {
  return <span aria-hidden className={cn("h-5 w-px shrink-0 bg-hairline-strong", className)} />;
}
