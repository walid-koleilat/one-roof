"use client";

import { PLACE_COLOUR, type PlaceKind } from "@/components/price-map";
import { cn } from "@/lib/utils";

/**
 * A place turned into a filter, sitting on the map rather than above it.
 *
 * These are not points of interest. Her mother does not drive, so "eleven
 * minutes to the hospital" and "bus at the corner" are the criteria she is
 * actually searching on, and the chips let her say so where she is already
 * looking instead of in a settings panel two screens away.
 *
 * They are checkboxes rather than the black pills a house filter uses, because
 * they do a different job: a house filter changes which homes exist, and these
 * change what is drawn around them. Each carries the colour its marker has on
 * the map, so turning one on and finding the matching dots is one act rather
 * than two.
 */
export function MapFilterChip({
  label,
  kind,
  active,
  onToggle,
}: {
  label: string;
  /** Decides the colour, and matches the marker this draws on the map. */
  kind: PlaceKind;
  active?: boolean;
  onToggle?: () => void;
}) {
  const colour = PLACE_COLOUR[kind];
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={cn(
        "flex h-9 shrink-0 items-center gap-2 rounded-[10px] border bg-background/95 px-3 text-[13px] font-medium backdrop-blur-[2px] transition-colors",
        active
          ? "border-transparent text-ink shadow-[0_1px_4px_rgba(22,24,26,0.16)]"
          : "border-[#DFE2E4] text-ink-body hover:border-hairline-strong",
      )}
      style={active ? { boxShadow: `inset 0 0 0 1.5px ${colour}` } : undefined}
    >
      <Box on={Boolean(active)} colour={colour} />
      <Glyph kind={kind} colour={active ? colour : "#8C9095"} />
      {label}
    </button>
  );
}

function Box({ on, colour }: { on: boolean; colour: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" className="shrink-0" aria-hidden>
      <rect
        x="1.2"
        y="1.2"
        width="13.6"
        height="13.6"
        rx="4.4"
        fill={on ? colour : "none"}
        stroke={on ? colour : "#C7CBCE"}
        strokeWidth="1.4"
      />
      {on ? (
        <path
          d="M4.6 8.2 L6.9 10.5 L11.4 5.8"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
}

/** The same marks the map draws, so the chip and its pins are one system. */
function Glyph({ kind, colour }: { kind: PlaceKind; colour: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" className="shrink-0" aria-hidden>
      {kind === "health" ? (
        <path
          d="M6.4 2.4 H9.6 V6.4 H13.6 V9.6 H9.6 V13.6 H6.4 V9.6 H2.4 V6.4 H6.4 Z"
          fill={colour}
        />
      ) : null}
      {kind === "transit" ? (
        <>
          <rect x="2.6" y="2.4" width="10.8" height="9" rx="2.2" fill={colour} />
          <rect x="4.4" y="4.4" width="7.2" height="3.4" rx="1" fill="#FFFFFF" />
          <circle cx="5.2" cy="13" r="1.5" fill={colour} />
          <circle cx="10.8" cy="13" r="1.5" fill={colour} />
        </>
      ) : null}
      {kind === "worship" ? (
        <>
          <path
            d="M8 1.9 C10.5 1.9 12.3 3.9 12.3 6.5 V13.8 H3.7 V6.5 C3.7 3.9 5.5 1.9 8 1.9 Z"
            fill={colour}
          />
          <path
            d="M8 7.6 C9 7.6 9.7 8.4 9.7 9.4 V13.8 H6.3 V9.4 C6.3 8.4 7 7.6 8 7.6 Z"
            fill="#FFFFFF"
          />
        </>
      ) : null}
      {kind === "grocery" ? (
        <>
          <path
            d="M2.6 4.2 H13.4 L12.2 12.4 H3.8 Z"
            fill={colour}
          />
          <path
            d="M5.8 4.2 A2.2 2.2 0 0 1 10.2 4.2"
            fill="none"
            stroke={colour}
            strokeWidth="1.5"
          />
        </>
      ) : null}
      {kind === "parks" ? (
        <>
          <circle cx="8" cy="6.6" r="4.4" fill={colour} />
          <rect x="7.2" y="9.6" width="1.6" height="4.4" rx="0.8" fill={colour} />
        </>
      ) : null}
    </svg>
  );
}
