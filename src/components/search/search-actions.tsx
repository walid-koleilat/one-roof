"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** How long the share button reads as copied after the link goes to the clipboard. */
const COPIED_FOR = 2000;

/**
 * Save and share, beside the count rather than on the bar.
 *
 * They act on the search as an object, and the count is where the search
 * is named, so they sit on its line. The bar is for what the search is and
 * how she looks at it; two icons at its far end were the first thing cut
 * off on every narrower screen and the last thing anyone found.
 *
 * Share is a copy, not a modal. The link goes to the clipboard, the button
 * confirms for two seconds, and nothing is sent to anyone: there is no
 * email step because there is nobody at the other end of it but her.
 */
export function SearchActions({
  saved,
  onToggleSave,
  shareHref,
}: {
  /**
   * Whether the search itself is kept. The page decides what a press does:
   * signed out it opens the account sheet, signed in it toggles this.
   */
  saved: boolean;
  onToggleSave: () => void;
  /**
   * What Share copies. Defaults to the page's own address; the page passes a
   * link that opens expanded when that is the view she is sharing from.
   */
  shareHref?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    },
    [],
  );
  const share = async () => {
    const href =
      shareHref === undefined
        ? window.location.href
        : new URL(shareHref, window.location.href).toString();
    try {
      await navigator.clipboard.writeText(href);
    } catch {
      // Refused, or no clipboard at all. Confirming a copy that did not
      // happen would be a lie, and the address bar still has the link.
      return;
    }
    setCopied(true);
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), COPIED_FOR);
  };

  return (
    <div className="flex shrink-0 items-center gap-5">
      {/*
        Text with a mark, not pills. The bar above is pills already, and two
        more beside the count read as two more filters; underlined words
        read as what they are, two things she can do with the search.
      */}
      <button
        type="button"
        aria-pressed={saved}
        onClick={onToggleSave}
        className={cn(
          "flex min-h-9 items-center gap-1.5 rounded-sm text-[13px]/5 font-medium underline underline-offset-[3px] transition-colors sm:min-h-0",
          saved ? "text-ink" : "text-ink hover:text-ink-body",
        )}
      >
        <Heart filled={saved} />
        {saved ? "Saved" : "Save search"}
        <span className="sr-only">
          {saved ? ". Remove it" : ". Keeps this search"}
        </span>
      </button>
      <button
        type="button"
        onClick={() => void share()}
        title={copied ? "Link copied" : "Share this search"}
        className="flex min-h-9 items-center gap-1.5 rounded-sm text-[13px]/5 font-medium text-ink underline underline-offset-[3px] transition-colors hover:text-ink-body sm:min-h-0"
      >
        {copied ? <TickIcon /> : <ShareIcon />}
        {copied ? "Copied" : "Share"}
        <span className="sr-only">
          {copied ? "" : " this search. Copies the link"}
        </span>
      </button>
      {/* Always in the tree, so the announcement is a change and gets read. */}
      <span aria-live="polite" className="sr-only left-0">
        {copied ? "Link copied" : null}
      </span>
    </div>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M8 13.6 C8 13.6 1.9 10.1 1.9 6.1 C1.9 4.2 3.4 2.8 5.2 2.8 C6.4 2.8 7.5 3.5 8 4.5 C8.5 3.5 9.6 2.8 10.8 2.8 C12.6 2.8 14.1 4.2 14.1 6.1 C14.1 10.1 8 13.6 8 13.6 Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="12" cy="3.6" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12.4" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.8 7 L10.2 4.6 M5.8 9 L10.2 11.4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** The link went to the clipboard. Two seconds of this, then the share glyph again. */
function TickIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 8.5L6.2 12.2L13.5 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
