"use client";

import { cn } from "@/lib/utils";

/**
 * Two buttons that change how much map she is looking at.
 *
 * It does not place itself. The page owns the map's frame and puts this
 * under the Expand control, where a map keeps that kind of thing; the
 * component only knows how far in and out it is allowed to go and stops
 * there, rather than letting the page hand it a level it cannot draw.
 *
 * The ends are disabled with `aria-disabled` rather than `disabled`, so a
 * button that has just run out of range stays where the focus was instead
 * of dropping it on the map.
 */

/** A quarter at a time. Small enough to feel like a nudge, exact in binary. */
export const ZOOM_STEP = 0.25;

export function MapZoom({
  zoom,
  min,
  max,
  onZoom,
}: {
  zoom: number;
  min: number;
  max: number;
  onZoom: (next: number) => void;
}) {
  const step = (direction: 1 | -1) => {
    const next = Math.min(max, Math.max(min, zoom + direction * ZOOM_STEP));
    if (next !== zoom) onZoom(next);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <ZoomButton
        label="Zoom in"
        glyph="+"
        enabled={zoom < max}
        onPress={() => step(1)}
      />
      <ZoomButton
        label="Zoom out"
        glyph={"−"}
        enabled={zoom > min}
        onPress={() => step(-1)}
      />
    </div>
  );
}

function ZoomButton({
  label,
  glyph,
  enabled,
  onPress,
}: {
  label: string;
  glyph: string;
  enabled: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      aria-disabled={!enabled}
      onClick={enabled ? onPress : undefined}
      className={cn(
        "flex size-[34px] items-center justify-center rounded-lg bg-background text-[17px] leading-none font-medium shadow-[0_2px_6px_rgba(22,24,26,0.14)] transition-colors",
        enabled ? "text-ink hover:bg-sunken" : "cursor-default text-ink-faint",
      )}
    >
      <span aria-hidden>{glyph}</span>
      <span className="sr-only">{label}</span>
    </button>
  );
}
