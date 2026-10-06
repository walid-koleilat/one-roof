"use client";

import { type ReactNode, useEffect } from "react";
import { RoofMark } from "@/components/wordmark";
import { MatterMark } from "@/components/matter-row";
import type { Listing } from "@/data/listings";
import { formatCurrency } from "@/lib/domain/format";
import { railLine, resultMattersFor } from "@/lib/domain/matters";
import { cn } from "@/lib/utils";

/**
 * The search with the page taken away.
 *
 * List, Both and Map are three ways of dividing one page. This is not a fourth
 * division, it is the same view with everything that is reading removed, which
 * is why it is reached from a control on the map rather than from a fourth
 * item in the toggle. She has just said she wants to look, not read.
 *
 * It is the one place in the product that ignores the 83rem container.
 * Everywhere else a wider monitor buys margin; here the rail is held and the
 * map takes whatever is left, which is the only honest use for the extra
 * width. It is also a state rather than a route, so the back button does not
 * throw her out of the search she is in the middle of.
 */
export function ExpandedView({
  bar,
  map,
  controls,
  listings,
  selected,
  count,
  onSelect,
  onCollapse,
  actions,
  signedIn,
  savedCount,
  onSignIn,
}: {
  /** The sticky bar, unchanged. Nothing here should have to be relearned. */
  bar: ReactNode;
  map: ReactNode;
  /** Drawn on the frame, not on the map, so the crop cannot carry them off. */
  controls: ReactNode;
  listings: readonly Listing[];
  selected: string | null;
  count: number;
  onSelect: (id: string) => void;
  onCollapse: () => void;
  /** Save and share, which the page owns; shown in the chrome beside the account. */
  actions?: React.ReactNode;
  /**
   * The nav is gone in this view, and these are the only two things it was
   * carrying: the mark, and the way in to an account. Signed out the right
   * end reads "Sign in"; signed in it reads how many are hers, the way the
   * nav says it, so nothing has to be relearned.
   */
  signedIn: boolean;
  savedCount: number;
  onSignIn: () => void;
}) {
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") onCollapse();
    }
    document.addEventListener("keydown", key);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = previous;
    };
  }, [onCollapse]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      {/*
        One bar of chrome. Three columns, each drawing its own hairline
        underneath: the bar in the middle already has one, and a rule on the
        row would double it there and leave the mark and the sign-in sitting on
        a line the bar does not share.
      */}
      <div className="flex shrink-0 items-stretch">
        <div className="flex shrink-0 items-center border-b border-hairline pr-1 pl-4">
          <AppMark />
        </div>
        <div className="min-w-0 grow">{bar}</div>
        <div className="flex shrink-0 items-center gap-3 border-b border-hairline pr-4 pl-1">
          {actions}
          <span aria-hidden className="h-5 w-px shrink-0 bg-hairline" />
          {signedIn ? (
            <span className="flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5 text-[13px]/[19px] font-medium whitespace-nowrap text-ink">
              <Heart />
              {savedCount} saved
            </span>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="rounded-full text-[13px]/5 font-medium whitespace-nowrap text-ink underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 grow flex-col lg:flex-row">
        <div className="flex w-full shrink-0 flex-col gap-3 overflow-y-auto border-hairline p-4 lg:w-[clamp(22rem,26%,30rem)] lg:border-r">
          <p className="flex items-baseline gap-2">
            <span className="text-[16px]/6 font-semibold text-ink">
              {count} homes
            </span>
            <span className="text-[13px]/5 text-ink-muted">
              in the area you drew
            </span>
          </p>
          {listings.map((listing) => (
            <RailCard
              key={listing.id}
              listing={listing}
              selected={selected === listing.id}
              onSelect={() => onSelect(listing.id)}
            />
          ))}
        </div>

        <div className="relative flex min-h-[20rem] grow items-center justify-center overflow-hidden">
          {/* The drawing covers the frame; the map decides the crop and holds the pins. */}
          <div className="h-full w-full">{map}</div>
          {controls}
          <button
            type="button"
            onClick={onCollapse}
            className="absolute top-5 right-5 z-10 flex size-[34px] items-center justify-center rounded-lg bg-ink text-white shadow-[0_2px_6px_rgba(22,24,26,0.2)]"
          >
            <CollapseIcon />
            <span className="sr-only">Leave the full view</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The fifth density: photo, the sentence, the one line that cleared or failed,
 * and the price.
 *
 * It keeps the row that carries a verdict and drops the one that carries a
 * photograph, because the photograph is already the left half of the card and
 * a thumbnail of the same house beside it is the same picture twice. Everything
 * else it drops she can get by pressing it.
 *
 * The verdict is one plain line - "Hospital 8 min, under your 15" - rather
 * than the card's three-part row. The rail has no second column to put her
 * number in, so `railLine` writes the comparison out instead.
 */
function RailCard({
  listing,
  selected,
  onSelect,
}: {
  listing: Listing;
  selected: boolean;
  onSelect: () => void;
}) {
  const [, verdict] = resultMattersFor(listing);
  const missed = verdict.tone === "unmet";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex shrink-0 overflow-hidden rounded-[10px] border bg-background text-left transition-[border-color,box-shadow]",
        selected
          ? "border-hairline-strong shadow-[0_2px_8px_rgba(22,24,26,0.07)]"
          : "border-hairline hover:border-hairline-strong",
      )}
    >
      <span
        aria-hidden
        className="h-[7.375rem] w-[8.25rem] shrink-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${listing.photos[0]})`,
          backgroundColor: listing.photoTint,
        }}
      />
      <span className="flex min-w-0 grow flex-col gap-1 px-[13px] py-[11px]">
        <span className="text-sm/[21px] font-semibold text-ink">
          {listing.address}
        </span>
        <span className="text-xs/[19px] text-ink-body">{listing.summary}</span>
        <span
          className={cn(
            "flex items-center gap-1.5 text-xs/[19px]",
            missed ? "text-conf-low" : "text-ink",
          )}
        >
          <span aria-hidden className="shrink-0">
            <MatterMark tone={verdict.tone} />
          </span>
          <span className="min-w-0">{railLine(verdict)}</span>
        </span>
        <span className="mt-auto text-[15px]/[23px] font-bold text-ink">
          {formatCurrency(listing.askingPrice.value)}
        </span>
      </span>
    </button>
  );
}

/**
 * The mark, not the wordmark.
 *
 * Board 11 draws a 26px ink square with a house in it where the nav's
 * wordmark used to be, and at 1440 the 110px wordmark was what pushed the
 * bar onto a second line. Announced as One Roof, because it still is.
 */
function AppMark() {
  return (
    <span
      role="img"
      aria-label="One Roof"
      className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-ink"
    >
      <RoofMark size={16} className="text-white" />
    </span>
  );
}

/** The nav's own heart, so "{n} saved" reads here exactly as it reads there. */
function Heart() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M8 13.6 C8 13.6 1.9 10.1 1.9 6.1 C1.9 4.2 3.4 2.8 5.2 2.8 C6.4 2.8 7.5 3.5 8 4.5 C8.5 3.5 9.6 2.8 10.8 2.8 C12.6 2.8 14.1 4.2 14.1 6.1 C14.1 10.1 8 13.6 8 13.6 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M1.5 1.5L6 6M14.5 1.5L10 6M10 10L14.5 14.5M6 10L1.5 14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
