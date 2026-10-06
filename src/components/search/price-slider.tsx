"use client";

import { useRef } from "react";
import { type Ceiling, CEILINGS } from "@/data/counts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/domain/format";
import type { PriceBar } from "@/lib/domain/route-pills";
import { cn } from "@/lib/utils";

/**
 * The price range, drawn the way the short-let site draws it: a thin-bar
 * histogram, a track under it, two thumbs that reach both ends, and the
 * two figures in pills under their labels at the ends.
 *
 * The bars are the homes in each bracket, which is the count under each
 * ceiling less the count under the one before, so they come from the same
 * table the button reads and nothing else. Within a bracket the bars are
 * spread by a fixed jitter that averages to the bracket's count, a drawing
 * decision the caption owns up to, since the table knows the bracket and
 * not what is inside it.
 *
 * It snaps to the bracket edges. The maximum stops at each edge and the
 * far right for none; the minimum at the far left for none and each edge.
 * The count between them is the count under the maximum less the count
 * under the minimum, both rows the table already has.
 *
 * What her house supports, once it is known, is a third pill between the
 * two, with the one thing she can do with it.
 */

/** Thin bars per bracket. Enough to read as a histogram. */
const BARS_PER_BRACKET = 7;

/**
 * How a bracket's homes are spread across its bars.
 *
 * The table knows how many homes sit in a bracket and nothing about where
 * inside it they fall, so the spread is a drawing decision: a fixed,
 * seeded jitter per bar that averages to one across the bracket, so the
 * bars in a bracket average to its count and the histogram reads like one
 * rather than like five steps. Fixed, so it never changes between renders
 * or between the server and the browser.
 */
function spread(bracket: number): readonly number[] {
  let seed = (bracket + 1) * 2654435761;
  const raw = Array.from({ length: BARS_PER_BRACKET }, () => {
    seed = (Math.imul(seed ^ (seed >>> 15), 0x2c1b3c6d) ^ 0x9e3779b9) >>> 0;
    return 0.55 + ((seed % 1000) / 1000) * 0.9;
  });
  const mean = raw.reduce((a, b) => a + b, 0) / raw.length;
  return raw.map((w) => w / mean);
}

export function PriceSlider({
  bars,
  floor,
  onPick,
  onFloor,
  afford,
  onUseAfford,
}: {
  /** The count under each ceiling, then under none; the last is the whole market. */
  bars: readonly PriceBar[];
  /** The minimum, as a stop, or null for none. */
  floor: Ceiling | null;
  onPick: (ceiling: Ceiling | null) => void;
  onFloor: (floor: Ceiling | null) => void;
  /** What her house supports, once the steps are walked. */
  afford?: { address: string; ceiling: number } | null;
  /** Sets the maximum to what her house supports. */
  onUseAfford?: () => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef<"min" | "max" | null>(null);
  const n = bars.length;
  // `priceBarsFor` selects exactly one, so this is never -1.
  const at = bars.findIndex((b) => b.selected);
  const stop = bars[at]!;
  /** Homes in each bracket: the difference between neighbouring cumulative counts. */
  const brackets = bars.map((bar, i) => Math.max(0, bar.count - (i > 0 ? bars[i - 1]!.count : 0)));
  /** Every bar's height, in homes, with the bracket's spread applied. */
  const heights = brackets.map((count, i) => spread(i).map((w) => count * w));
  const tallest = Math.max(1, ...heights.flat());
  /** The maximum's positions: each bracket's right edge, the far right for none. */
  const maxLeft = (i: number) => ((i + 1) / n) * 100;
  /** The minimum's positions: the far left for none, then each bracket's right edge. */
  const low = floor === null ? 0 : (CEILINGS as readonly number[]).indexOf(floor) + 1;
  const lowLeft = (k: number) => (k / n) * 100;
  /** The highest position the minimum may take: under the maximum, or anywhere when there is none. */
  const lowMax = stop.ceiling === null ? CEILINGS.length : Math.max(0, at);

  function pickMax(i: number) {
    const next = Math.min(Math.max(i, 0), n - 1);
    if (next === at) return;
    onPick(bars[next]!.ceiling);
    // A maximum dropped under the minimum takes the minimum down with it.
    const ceilingIndex = bars[next]!.ceiling === null ? CEILINGS.length : next;
    if (low > ceilingIndex) onFloor(ceilingIndex === 0 ? null : CEILINGS[ceilingIndex - 1]!);
  }

  function pickMin(k: number) {
    const next = Math.min(Math.max(k, 0), lowMax);
    if (next === low) return;
    onFloor(next === 0 ? null : CEILINGS[next - 1]!);
  }

  function share(clientX: number): number {
    const box = track.current?.getBoundingClientRect();
    if (!box || box.width === 0) return 0;
    return ((clientX - box.left) / box.width) * 100;
  }

  function nearest(s: number, positions: readonly number[]): number {
    let best = 0;
    positions.forEach((p, i) => {
      if (Math.abs(s - p) < Math.abs(s - positions[best]!)) best = i;
    });
    return best;
  }

  function move(s: number) {
    if (dragging.current === "max") pickMax(nearest(s, bars.map((_, i) => maxLeft(i))));
    else if (dragging.current === "min") pickMin(nearest(s, [0, ...CEILINGS.map((_, k) => lowLeft(k + 1))]));
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const s = share(event.clientX);
    // Whichever thumb is nearer takes the press; a tie goes to the one that can move that way.
    const dMin = Math.abs(s - lowLeft(low));
    const dMax = Math.abs(s - maxLeft(at));
    dragging.current = dMin < dMax || (dMin === dMax && s < maxLeft(at)) ? "min" : "max";
    event.currentTarget.setPointerCapture(event.pointerId);
    move(s);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    move(share(event.clientX));
  }

  function onPointerEnd() {
    dragging.current = null;
  }

  function keys(event: React.KeyboardEvent<HTMLDivElement>, which: "min" | "max") {
    const current = which === "max" ? at : low;
    const last = which === "max" ? n - 1 : lowMax;
    const step: Record<string, number> = {
      ArrowLeft: current - 1,
      ArrowDown: current - 1,
      ArrowRight: current + 1,
      ArrowUp: current + 1,
      Home: 0,
      End: last,
    };
    const next = step[event.key];
    if (next === undefined) return;
    event.preventDefault();
    if (which === "max") pickMax(next);
    else pickMin(next);
  }

  const maxText =
    stop.ceiling === null
      ? `No ceiling, ${stop.count} homes`
      : `Under ${stop.label}, ${stop.count} homes`;
  const minText = floor === null ? "No minimum" : `From ${formatCurrency(floor)}`;
  const affordIndex = afford ? bars.findIndex((b) => b.ceiling === afford.ceiling) : -1;
  const usingAfford = !!afford && stop.ceiling === afford.ceiling;
  const lastCeiling = CEILINGS[CEILINGS.length - 1]!;

  return (
    <div className="flex flex-col gap-4 select-none">
      <div
        ref={track}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onLostPointerCapture={onPointerEnd}
        className="relative touch-none px-3 pt-1 pb-3"
      >
        {/*
          The histogram: a run of thin bars per bracket, one height each.
          Once her house has a number, the brackets beyond what it supports
          fade, whatever the thumbs say, so the reach of her house reads on
          the same bars as the range she set, without a second colour.
        */}
        <div aria-hidden className="flex h-20 items-end gap-[3px]">
          {heights.flatMap((bracket, i) =>
            bracket.map((height, j) => (
              <span
                key={`${i}-${j}`}
                className={cn(
                  "min-h-[3px] grow rounded-t-[3px] transition-[background-color,opacity]",
                  i >= low && i <= at ? "bg-action" : "bg-hairline-strong",
                  affordIndex >= 0 && i > affordIndex && "opacity-30",
                )}
                style={{ height: `${Math.round((height / tallest) * 100)}%` }}
              />
            )),
          )}
        </div>

        <div className="relative h-0.5 rounded-full bg-hairline-strong">
          <span
            aria-hidden
            className="absolute inset-y-0 rounded-full bg-action"
            style={{ left: `${lowLeft(low)}%`, width: `${maxLeft(at) - lowLeft(low)}%` }}
          />
          <Thumb
            label="Minimum price"
            value={low}
            max={lowMax}
            text={minText}
            left={lowLeft(low)}
            onKeyDown={(event) => keys(event, "min")}
          />
          <Thumb
            label="Maximum price"
            value={at}
            max={n - 1}
            text={maxText}
            left={maxLeft(at)}
            onKeyDown={(event) => keys(event, "max")}
          />
        </div>

        {/* The bracket edges, named; the one her house reaches says so. */}
        <div aria-hidden className={cn("relative mt-4", affordIndex >= 0 && affordIndex < CEILINGS.length ? "h-8" : "h-4")}>
          {CEILINGS.map((ceiling, i) => (
            <span
              key={ceiling}
              className={cn(
                "absolute flex -translate-x-1/2 flex-col items-center gap-0.5 text-[11px]/4 whitespace-nowrap",
                i === at || i + 1 === low ? "font-semibold text-ink" : "text-ink-muted",
              )}
              style={{ left: `${maxLeft(i)}%` }}
            >
              {formatCurrencyCompact(ceiling)}
              {i === affordIndex ? (
                <span className="font-normal text-action-deep">what your house supports</span>
              ) : null}
            </span>
          ))}
        </div>
      </div>

      {/* The two figures at the ends, under their labels, and a third between them once her house has a number. */}
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <Pill label="Minimum" value={floor === null ? "No minimum" : formatCurrency(floor)} />
        {afford && affordIndex >= 0 ? (
          <div className="flex min-w-0 flex-col items-center gap-1.5">
            <span className="text-[12px]/4 text-action-deep">
              From your house at {afford.address}
            </span>
            <span className="flex items-center gap-3 rounded-full border-[1.5px] border-action bg-action-tint py-1.5 pr-1.5 pl-4">
              <span className="text-[15px]/[22px] font-medium whitespace-nowrap text-ink">
                Up to {formatCurrency(afford.ceiling)}
              </span>
              {usingAfford ? (
                <span
                  aria-label="Your maximum is set there"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-white"
                >
                  <svg width="12" height="10" viewBox="0 0 13 10" fill="none" aria-hidden>
                    <path
                      d="M1 5L4.6 8.6L12 1.2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onUseAfford}
                  className="shrink-0 rounded-full bg-ink px-3.5 py-1.5 text-[13px]/5 font-medium text-white transition-colors hover:bg-ink/90"
                >
                  Use it
                </button>
              )}
            </span>
          </div>
        ) : null}
        <Pill
          label="Maximum"
          value={stop.ceiling === null ? `${formatCurrency(lastCeiling)}+` : stop.label}
          end
        />
      </div>
    </div>
  );
}

/** A plain white disc with a hairline, the thumb everyone knows; no ring, no ball. */
function Thumb({
  label,
  value,
  max,
  text,
  left,
  onKeyDown,
}: {
  label: string;
  value: number;
  max: number;
  text: string;
  left: number;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={text}
      onKeyDown={onKeyDown}
      className="absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border border-[#B4B2A9] bg-background shadow-[0_1px_3px_rgba(22,24,26,0.14)] transition-[left] duration-150 outline-none focus-visible:border-ink active:cursor-grabbing"
      style={{ left: `${left}%` }}
    />
  );
}

/** A figure in a pill under its label, at one end of the row. */
function Pill({ label, value, end = false }: { label: string; value: string; end?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1.5", end ? "items-end" : "items-start")}>
      <span className="text-[12px]/4 text-ink-muted">{label}</span>
      <span className="rounded-full border border-hairline-strong px-5 py-2 text-[15px]/[22px] font-medium whitespace-nowrap text-ink">
        {value}
      </span>
    </div>
  );
}
