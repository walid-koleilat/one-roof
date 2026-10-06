"use client";

import { useEffect, useRef, useState } from "react";
import { PLACE_COLOUR, type PlaceKind } from "@/components/price-map";
import { LayerGlyph } from "@/components/search/layer-glyph";
import { cn } from "@/lib/utils";

/**
 * The place layers, behind one control instead of across five.
 *
 * A row of five chips is fine on a map that owns the full width and clipped
 * mid-word the moment the map became a column beside the list. The map is the
 * one surface whose width is not ours to decide, so its own controls cannot
 * assume it.
 *
 * It is called Nearby, because that is the question it answers: what is near
 * these homes. "Places" was the file's word and it named nothing she asked
 * for. Each row carries the badge the map draws for that layer, in the
 * layer's colour, so the control shows what it switches on rather than
 * describing it.
 *
 * The distinction this control keeps: these decide what is *drawn* around the
 * homes, not which homes exist. "Show me the temples" is a different act from
 * "only homes within six minutes of one", and the second one lives in Filters
 * with everything else that changes the count. So nothing in here moves the
 * number on the bar, and the panel says so.
 */

export interface PlaceOption {
  kind: PlaceKind;
  label: string;
}

export function PlacesDrawer({
  options,
  active,
  onToggle,
}: {
  options: readonly PlaceOption[];
  active: readonly PlaceKind[];
  onToggle: (kind: PlaceKind) => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function away(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-[38px] shrink-0 items-center gap-2 rounded-[10px] border px-3.5 text-[13px] font-medium backdrop-blur-[2px] transition-colors",
          open
            ? "border-ink bg-ink text-white"
            : "border-[#DFE2E4] bg-background/95 text-ink-body hover:border-ink-faint",
        )}
      >
        <NearbyIcon />
        Nearby
        <span
          className={cn(
            "text-[12px] font-semibold",
            open ? "text-white" : "text-ink-muted",
          )}
        >
          {active.length}
        </span>
        <Chevron open={open} />
      </button>

      <div
        hidden={!open}
        className="absolute top-[46px] left-0 z-20 w-[248px] overflow-hidden rounded-xl border border-hairline bg-background shadow-[0_12px_32px_rgba(22,24,26,0.16)]"
      >
        {options.map((option) => {
          const on = active.includes(option.kind);
          return (
            <button
              key={option.kind}
              type="button"
              role="switch"
              aria-checked={on}
              onClick={() => onToggle(option.kind)}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-sunken"
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-md border bg-background transition-colors",
                  on ? "border-hairline-strong" : "border-hairline",
                )}
              >
                <LayerGlyph
                  kind={option.kind}
                  size={14}
                  colour={on ? PLACE_COLOUR[option.kind] : "var(--ds-ink-faint)"}
                />
              </span>
              <span
                className={cn(
                  "grow text-[13px]/5",
                  on ? "font-medium text-ink" : "text-ink-body",
                )}
              >
                {option.label}
              </span>
              <Tick shown={on} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Three stacked layers: the map's own word for "what is drawn on it". */
function NearbyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M7 1.8L12.6 4.6L7 7.4L1.4 4.6L7 1.8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M1.4 7.2L7 10L12.6 7.2M1.4 9.8L7 12.6L12.6 9.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      aria-hidden
      className={cn("transition-transform", open && "rotate-180")}
    >
      <path
        d="M1 1L5 5L9 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Tick({ shown }: { shown: boolean }) {
  if (!shown) return null;
  return (
    <svg width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden>
      <path
        d="M1 5L4.6 8.6L12 1.2"
        stroke="var(--ds-action-deep)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
