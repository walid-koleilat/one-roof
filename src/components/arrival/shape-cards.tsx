"use client";

import { SHAPE_FLOOR, SHAPE_TOTAL, type Shape } from "@/data/counts";
import { formatCurrency } from "@/lib/domain/format";
import { cn } from "@/lib/utils";

/**
 * The three shapes, as switches rather than as an explainer.
 *
 * The assistant described these in the chat. Here they do something: turning
 * one off takes its homes out of the map and the list below, and the count
 * changes to say so. That is the point of repeating them - not to teach the
 * idea twice, but to hand her the control the explanation implied.
 *
 * "Room to add a suite" is off by default and stays visually quieter when on.
 * A basement that meets code is not a home with a suite, and the design should
 * not let the two look like the same kind of answer.
 */

export interface ShapeOption {
  shape: Shape;
  title: string;
  /** Two words, for the sticky bar, where the full title will not fit. */
  short: string;
  detail: string;
  image: string;
}

export const SHAPES: readonly ShapeOption[] = [
  {
    shape: "suite",
    title: "A legal suite already",
    short: "Suite",
    detail: "Second kitchen, own door, permit on file.",
    image: "/shapes/suite.jpg",
  },
  {
    shape: "ground",
    title: "A bedroom and bath on the ground floor",
    short: "Ground floor",
    detail: "Bed and bath at ground level. No stairs.",
    image: "/shapes/ground.jpg",
  },
  {
    shape: "convert",
    title: "Room to add a legal suite",
    short: "Could convert",
    detail: "Ceiling height and windows already meet code. Most basements do not.",
    image: "/shapes/convert.jpg",
  },
];

export function ShapeCards({
  on,
  onToggle,
}: {
  on: readonly Shape[];
  onToggle: (shape: Shape) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SHAPES.map((option) => {
        const active = on.includes(option.shape);
        const extra = option.shape === "convert";
        return (
          <button
            key={option.shape}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(option.shape)}
            className={cn(
              "flex flex-col gap-3.5 rounded-xl border bg-background p-4 text-left transition-[border-color,box-shadow] duration-200 sm:p-5",
              active
                ? "border-action shadow-[0_2px_10px_rgba(40,163,179,0.13)]"
                : "border-hairline hover:border-hairline-strong",
            )}
          >
            <span
              role="img"
              aria-label=""
              className="h-[140px] shrink-0 rounded-lg bg-sunken bg-cover bg-center sm:h-[170px]"
              style={{ backgroundImage: `url(${option.image})` }}
            />

            <span className="flex items-start gap-2.5">
              <Tick on={active} />
              <span
                className={cn(
                  "text-[15px]/[23px] text-ink sm:text-base/6",
                  active ? "font-semibold" : "font-medium",
                )}
              >
                {option.title}
              </span>
            </span>

            <span className="text-[13px]/[21px] text-ink-muted">
              {option.detail}
            </span>

            <span className="mt-auto flex items-baseline justify-between gap-3 pt-1">
              <span className="text-sm/[22px] font-semibold text-ink">
                From {formatCurrency(SHAPE_FLOOR[option.shape])}
              </span>
              <span
                className={cn(
                  "text-[13px]/5",
                  extra ? "font-medium text-action-deep" : "text-ink-faint",
                )}
              >
                {extra ? "+" : ""}
                {SHAPE_TOTAL[option.shape]} homes
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Tick({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="mt-[3px] shrink-0" aria-hidden>
      {on ? (
        <>
          <circle cx="9" cy="9" r="8.2" fill="var(--ds-action)" />
          <path
            d="M5.3 9.3 L7.9 11.9 L12.8 6.5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <circle cx="9" cy="9" r="8.2" fill="none" stroke="#A9ADB1" strokeWidth="1.4" />
          <path
            d="M9 5.4 L9 12.6 M5.4 9 L12.6 9"
            stroke="#5C6066"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
