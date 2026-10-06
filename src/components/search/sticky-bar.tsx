"use client";

import { forwardRef, type ReactNode, useEffect, useRef, useState } from "react";
import { PLACE_COLOUR, type PlaceKind } from "@/components/price-map";
import { LayerGlyph } from "@/components/search/layer-glyph";
import { type Minutes, type Need, NEEDS, type SearchState, type Shape } from "@/data/counts";
import { MinutesStepper } from "@/components/search/minutes-stepper";
import { NEED_NAME, needLabel, needRowsFor, routePillsFor } from "@/lib/domain/route-pills";
import { cn } from "@/lib/utils";

/**
 * The one bar that stays on screen while she reads.
 *
 * It carries what the chat put on the page, under an eyebrow that says so,
 * then Filters, the live total, and which of the three views she is in.
 * Save and share sit beside the count, where the search is named. The three shapes are types, and types are in
 * Filters with everything else typical rather than loose on the bar. With a conversation behind her there is no
 * search field in it: the chips under the eyebrow are the search, and the
 * eyebrow opens her sentences where any of it changes. Without one the bar
 * is Filters and the view toggle and nothing else, because nothing came
 * from a chat and a chip standing in for one would claim otherwise.
 *
 * Two rules the bar exists to keep. The count on the control, so she can see
 * what a constraint costs before she applies it. And the total withheld while
 * it is being worked out, because a stale number she can read is worse than no
 * number for the moment it takes to recount - she will act on the stale one.
 *
 * Colour does no work here. The routes are on or off by fill, not by hue,
 * which leaves blue to mean action and warm to mean worse-than-the-line she
 * set. Two colours were doing four jobs; this is one of the jobs removed.
 */

export type View = "list" | "both" | "map";

const VIEWS: readonly { view: View; label: string; icon: ReactNode }[] = [
  { view: "list", label: "List", icon: <ListIcon /> },
  { view: "both", label: "Both", icon: <SplitIcon /> },
  { view: "map", label: "Map", icon: <PinIcon /> },
];

export function StickyBar({
  state,
  summary,
  total,
  view,
  onToggleShape,
  onView,
  onOpenSearch,
  searchOpen = false,
  filterCount,
  onOpenFilters,
  needs,
  onToggleNeed,
  minutes,
  onMinutes,
}: {
  state: SearchState;
  /**
   * What she told the chat, short enough to sit on one line, or null when
   * there was no chat. With nothing declared this is a plain area search, and
   * a pill reading "from your chat" over an empty string would be a claim the
   * page cannot support.
   */
  summary: string | null;
  /** Null while the count is being worked out. */
  total: number | null;
  view: View;
  onToggleShape: (shape: Shape) => void;
  onView: (view: View) => void;
  /** Takes her back to the full search, which this bar is the collapsed form of. */
  onOpenSearch: () => void;
  /** The context panel is open, so the pill reads as pressed. */
  searchOpen?: boolean;
  /** How many of the long-tail filters are on. Zero hides the badge. */
  filterCount: number;
  onOpenFilters: () => void;
  /** The nearby requirements. The same booleans the panel switches. */
  needs: Record<Need, boolean>;
  onToggleNeed: (need: Need) => void;
  /** How far each reaches, and where she moves it. */
  minutes: Record<Need, Minutes>;
  onMinutes: (need: Need, minutes: Minutes) => void;
}) {
  const pills = routePillsFor(state);
  const placeRows = needRowsFor(state);

  /**
   * The places, behind one chip that expands, rather than a chip per place.
   * The popover is anchored to the bar rather than to the chip, because the
   * chip sits in a row that scrolls sideways and a popover inside that row
   * would be clipped by it.
   */
  const [placesOpen, setPlacesOpen] = useState(false);
  const [placesLeft, setPlacesLeft] = useState(0);
  const barBox = useRef<HTMLDivElement>(null);
  const placesChip = useRef<HTMLButtonElement>(null);
  const placesBox = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!placesOpen) return;
    function away(event: MouseEvent) {
      const target = event.target as Node;
      if (placesBox.current?.contains(target) || placesChip.current?.contains(target)) return;
      setPlacesOpen(false);
    }
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") setPlacesOpen(false);
    }
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", key);
    };
  }, [placesOpen]);
  function togglePlaces() {
    const bar = barBox.current?.getBoundingClientRect();
    const chip = placesChip.current?.getBoundingClientRect();
    if (bar && chip) {
      setPlacesLeft(Math.max(0, Math.min(chip.left - bar.left, bar.width - PLACES_WIDTH)));
    }
    setPlacesOpen((open) => !open);
  }
  const placesOn = NEEDS.filter((need) => needs[need]).length;

  const chatDriven = summary !== null;
  /**
   * What the conversation put on the bar sits under its own eyebrow, three
   * chips at most, in her words. Everything else is the row everyone gets.
   * Without a chat nothing came from one, and every chip is typical.
   */
  // Her kitchen and her father's fall, in her words; Places carries the rest.
  const chatShapes: readonly Shape[] = chatDriven ? ["suite", "ground"] : [];
  // The three shapes are types, and types live in Filters with the rest of
  // the typical controls. Places is one chip that expands, and it exists
  // only under the eyebrow: the places on it came from the chat, and with
  // no chat the same four are reached through Filters like everything else.

  return (
    <div className="sticky top-0 z-30 border-y border-hairline bg-background shadow-[0_3px_10px_rgba(22,24,26,0.07)]">
      {/*
        One centred row, the way the bar everybody knows draws it: the
        typical Filters on the left, a rule, then what the conversation put
        here under an eyebrow that says so. The view toggle is pinned to the
        right, outside the centred group. Every chip is the same
        pill with a glyph, the way the bar everybody knows draws them, and
        on or off is the border, never the hue.

        Under 64rem it is two lines, and which two is decided rather than
        left to wrapping: the chat's chips under their eyebrow first, on a
        line of their own, then Filters with the view toggle at the far end. The order below is the
        desktop order; `order-*` rearranges it on a phone, and the break
        element forces the second line to start at Filters.
      */}
      <div
        ref={barBox}
        className="relative mx-auto flex w-full max-w-[1328px] flex-wrap items-end gap-x-2.5 gap-y-2 px-4 py-[9px] lg:flex-nowrap lg:justify-center lg:pr-[15rem] lg:pl-[15rem]"
      >
        {chatDriven ? (
          <div className="order-1 flex min-w-0 basis-full flex-col gap-1.5 lg:order-3 lg:shrink-0 lg:basis-auto">
            <button
              type="button"
              aria-expanded={searchOpen}
              onClick={onOpenSearch}
              className="flex w-fit items-center gap-1.5 rounded-sm font-mono text-[10px]/3 font-medium tracking-[0.09em] whitespace-nowrap text-ink-muted uppercase transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
            >
              <span className="sm:hidden">From your chat</span>
              <span className="hidden sm:inline">From your ChatGPT conversation</span>
              <span
                className={cn(
                  "shrink-0 transition-transform",
                  searchOpen && "rotate-180",
                )}
              >
                <ChevronIcon />
              </span>
            </button>
            <div className="flex items-center gap-2 overflow-x-auto pr-7 [scrollbar-width:none] max-lg:[mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)] [&::-webkit-scrollbar]:hidden">
              {pills
                .filter((pill) => chatShapes.includes(pill.shape))
                .map((pill) => (
                  <ShapeChip
                    key={pill.shape}
                    pill={pill}
                    label={HER_SHAPE_WORDS[pill.shape]}
                    onToggle={() => onToggleShape(pill.shape)}
                  />
                ))}
              <PlacesChip
                ref={placesChip}
                on={placesOn}
                open={placesOpen}
                onToggle={togglePlaces}
              />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onOpenFilters}
          className="order-4 flex min-h-9 shrink-0 items-center gap-[7px] rounded-full border border-hairline-strong bg-background px-[14px] py-1.5 text-[13px]/5 font-medium text-ink transition-colors hover:border-ink lg:order-1"
        >
          <SlidersIcon />
          Filters
          {filterCount > 0 ? (
            <span className="rounded-full bg-ink px-1.5 text-[12px] font-semibold text-white">
              {filterCount}
            </span>
          ) : null}
        </button>

        {/* The rule divides the typical from the chat's, so it goes with the chat's. */}
        {chatDriven ? (
          <span aria-hidden className="order-5 mb-2 hidden h-5 w-px shrink-0 bg-hairline sm:block lg:order-2" />
        ) : null}

        {/*
          The number lives in the heading now. It is still announced here
          while it settles, so a screen reader hears the recount the sighted
          reader sees.
        */}
        <span aria-live="polite" className="sr-only left-0">
          {total === null ? "Counting" : `${total} homes`}
        </span>

        {/* On a phone the toggle shares the eyebrow's line, so the chips get the full width under it. */}
        <div className="order-7 ml-auto flex shrink-0 overflow-hidden rounded-full border border-hairline-strong lg:absolute lg:top-1/2 lg:right-4 lg:ml-0 lg:-translate-y-1/2">
          {VIEWS.map((option) => (
            <button
              key={option.view}
              type="button"
              aria-pressed={view === option.view}
              onClick={() => onView(option.view)}
              className={cn(
                "items-center gap-1.5 px-3.5 py-[7px] text-[12px]/5 font-medium transition-colors",
                // Below 64rem the columns stack, so there is no Both to be
                // in, and the toggle collapses to List and Map.
                option.view === "both" ? "hidden lg:flex" : "flex",
                view === option.view
                  ? "bg-ink text-white"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        {placesOpen ? (
          <div
            ref={placesBox}
            id="places-within-reach"
            role="group"
            aria-label="Places within reach"
            style={{ left: placesLeft, width: PLACES_WIDTH }}
            className="absolute top-full z-40 mt-1.5 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-hairline bg-background shadow-[0_12px_32px_rgba(22,24,26,0.16)]"
          >
            <p className="px-4 pt-3 pb-1 font-mono text-[10px]/3 font-medium tracking-[0.09em] text-ink-muted uppercase">
              {chatDriven ? "Within reach · from your conversation" : "Within reach"}
            </p>
            <ul className="flex flex-col px-1.5 pb-1.5">
              {placeRows.map((row) => {
                const label = needLabel(row.need, minutes);
                const on = needs[row.need];
                return (
                  <li key={row.need} className="flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 py-1.5">
                    <LayerGlyph
                      kind={NEED_LAYER[row.need]}
                      size={15}
                      colour={on ? PLACE_COLOUR[NEED_LAYER[row.need]] : "var(--ds-ink-faint)"}
                    />
                    <span className={cn("w-[74px] shrink-0 text-[13px]/5 whitespace-nowrap", on ? "font-medium text-ink" : "text-ink-body")}>
                      {NEED_NAME[row.need]}
                    </span>
                    <MinutesStepper
                      name={NEED_NAME[row.need]}
                      minutes={minutes[row.need]}
                      disabled={!on}
                      onChange={(next) => onMinutes(row.need, next)}
                    />
                    <span className="grow" />
                    <span className={cn("text-[12px]/5 font-semibold tabular-nums", on ? "text-ink" : "text-ink-muted")}>
                      {row.withOn}
                    </span>
                    <Switch on={on} label={label} onToggle={() => onToggleNeed(row.need)} />
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** How wide the places popover is, so it can be kept inside the bar. */
const PLACES_WIDTH = 408;

/** The shapes in the words she used for them, for the chips under the eyebrow. */
const HER_SHAPE_WORDS: Record<Shape, string> = {
  suite: "Own kitchen",
  ground: "No stairs",
  convert: "Could convert",
};

/**
 * One chip, the way the bar everybody knows draws them: a word, and on or
 * off carried by the border rather than the hue. No glyph; only Filters
 * carries a mark, so the row reads as words. The shape chips
 * add the count they contribute, or would add, with the sign saying which.
 */
function Chip({
  on,
  onToggle,
  children,
}: {
  on: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={cn(
        "flex min-h-9 shrink-0 items-center gap-2 rounded-full border bg-background px-3.5 py-1.5 text-[13px]/5 whitespace-nowrap transition-[border-color,box-shadow]",
        on
          ? "border-ink text-ink shadow-[inset_0_0_0_1px_var(--ds-ink)]"
          : "border-hairline-strong text-ink-body hover:border-ink",
      )}
    >
      {children}
    </button>
  );
}

function ShapeChip({
  pill,
  label,
  onToggle,
}: {
  pill: ReturnType<typeof routePillsFor>[number];
  label: string;
  onToggle: () => void;
}) {
  return (
    <Chip on={pill.active} onToggle={onToggle}>
      {label}
      {/* Three chips fit a phone's width without the counts, and not with them. Read out still. */}
      <span className={cn("font-semibold max-sm:sr-only", pill.active ? "text-ink" : "text-ink-muted")}>
        {pill.active ? pill.delta : `+${pill.delta}`}
      </span>
      <span className="sr-only">
        {pill.active
          ? "homes of this shape in your search. Take them out"
          : "homes this would add. Put them in"}
      </span>
    </Chip>
  );
}

/**
 * One chip for all the places, with how many are required and a chevron,
 * the way the map's Nearby control reads. It expands rather than spreading
 * the places out as a chip each: four chips said "four filters" about what
 * is one question, how far things can be.
 */
const PlacesChip = forwardRef<
  HTMLButtonElement,
  { on: number; open: boolean; onToggle: () => void }
>(function PlacesChip({ on, open, onToggle }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-expanded={open}
      aria-controls="places-within-reach"
      onClick={onToggle}
      className={cn(
        "flex min-h-9 shrink-0 items-center gap-2 rounded-full border bg-background px-3.5 py-1.5 text-[13px]/5 whitespace-nowrap transition-[border-color,box-shadow]",
        open
          ? "border-ink text-ink shadow-[inset_0_0_0_1px_var(--ds-ink)]"
          : on > 0
            ? "border-ink text-ink shadow-[inset_0_0_0_1px_var(--ds-ink)]"
            : "border-hairline-strong text-ink-body hover:border-ink",
      )}
    >
      Places
      <span className={cn("font-semibold", on > 0 ? "text-ink" : "text-ink-muted")}>
        {on}
      </span>
      <span className={cn("shrink-0 transition-transform", open && "rotate-180")}>
        <ChevronIcon />
      </span>
      <span className="sr-only">required within reach</span>
    </button>
  );
});

function Switch({
  on,
  label,
  onToggle,
}: {
  on: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "relative h-[19px] w-[34px] shrink-0 rounded-full transition-colors duration-150",
        on ? "bg-ink" : "bg-hairline",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-[2px] left-0 size-[15px] rounded-full bg-background transition-transform duration-150",
          on ? "translate-x-[17px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );
}

/** Which map layer each requirement draws, for the glyph on its chip. */
const NEED_LAYER: Record<Need, PlaceKind> = {
  nearHospital: "health",
  nearTransit: "transit",
  nearTemple: "worship",
  nearGrocery: "grocery",
};

/** The field's glyph, for the visitor who never had a chat. */

function ChevronIcon() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden>
      <path
        d="M1 1L5 5L9 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-ink-muted"
      />
    </svg>
  );
}

/**
 * The three views, drawn rather than named.
 *
 * The words stay beside them. An icon-only segmented control makes the reader
 * guess which rectangle means what, and "Both" is the one nobody guesses.
 */
function SlidersIcon() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
      <path
        d="M1 2H13M3.5 6H10.5M6 10H8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="13" height="11" viewBox="0 0 13 11" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="4" height="4" rx="1" stroke="currentColor" />
      <rect x="0.5" y="6.5" width="4" height="4" rx="1" stroke="currentColor" />
      <path d="M6.8 2.5H12.5M6.8 8.5H12.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function SplitIcon() {
  return (
    <svg width="13" height="11" viewBox="0 0 13 11" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="12" height="10" rx="1.5" stroke="currentColor" />
      <path d="M5.5 0.5V10.5" stroke="currentColor" />
      <path d="M2 3.5H4M2 6.5H4" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden>
      <path
        d="M5.5 12C5.5 12 9.75 8.2 9.75 5A4.25 4.25 0 0 0 1.25 5c0 3.2 4.25 7 4.25 7Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <circle cx="5.5" cy="4.9" r="1.4" stroke="currentColor" />
    </svg>
  );
}
