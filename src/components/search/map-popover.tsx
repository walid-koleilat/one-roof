"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAccount } from "@/components/account/account-provider";
import { PriceDeltaChip } from "@/components/price-delta-chip";
import type { Listing } from "@/data/listings";
import { formatCurrency } from "@/lib/domain/format";
import { cn } from "@/lib/utils";

/**
 * The compact card, raised over the map by a pin.
 *
 * Pressing a pin never leaves the map. It does not scroll the list, it does
 * not open the listing, it puts the house in front of her where she is
 * looking and lets the X take it away again. That is the whole contract, and
 * the reason this is not a route.
 *
 * The photograph is the whole top of the card and she can page through it
 * where she stands, with an arrow only where there is somewhere to go. Save
 * sits on the photograph beside the X, because on a map card those are the
 * two things a hand goes to. It keeps the sentence and drops the checklist:
 * at 288px there is room to say what the house is, and not room to say it
 * against four of her lines. The card in the column carries those, and it
 * lights when this one opens.
 *
 * It sits beside its pin, below when there is room and above when there is
 * not, clamped to the frame so the crop cannot carry half of it off.
 */
export function MapPopover({
  listing,
  onClose,
}: {
  listing: Listing;
  onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);
  const [photo, setPhoto] = useState(0);
  const { save, isSaved } = useAccount();
  const saved = isSaved(listing.id);
  const count = listing.photos.length;

  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [onClose]);

  useLayoutEffect(() => {
    function place() {
      const self = box.current;
      const frame = self?.parentElement;
      const pin = frame?.querySelector<SVGGElement>(
        `[data-pin="${listing.id}"]`,
      );
      if (!self || !frame || !pin) return;
      const f = frame.getBoundingClientRect();
      const p = pin.getBoundingClientRect();
      const w = self.offsetWidth;
      const h = self.offsetHeight;
      const inset = 12;
      const gap = 8;
      const left = Math.min(
        Math.max(p.left - f.left + p.width / 2 - w / 2, inset),
        f.width - w - inset,
      );
      const below = p.bottom - f.top + gap;
      const above = p.top - f.top - gap - h;
      const top =
        below + h <= f.height - inset ? below : Math.max(above, inset);
      setAt({ left, top });
    }
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [listing.id]);

  return (
    <div
      ref={box}
      role="group"
      aria-label={`${listing.address}, over the map`}
      style={at ? { left: at.left, top: at.top } : undefined}
      className="absolute z-20 w-[18rem] overflow-hidden rounded-2xl border border-hairline bg-background shadow-[0_8px_28px_rgba(22,24,26,0.2)]"
    >
      <div
        role="img"
        aria-label={`${listing.address}, photograph ${photo + 1} of ${count}`}
        className="relative h-[10.5rem] bg-cover bg-center"
        style={{
          backgroundImage: `url(${listing.photos[photo]})`,
          backgroundColor: listing.photoTint,
        }}
      >
        <div className="absolute top-2.5 right-2.5 flex items-center gap-2">
          <button
            type="button"
            aria-pressed={saved}
            onClick={() => save(listing.id)}
            className={cn(
              "flex size-8 items-center justify-center rounded-full shadow-[0_1px_3px_rgba(22,24,26,0.25)] transition-colors",
              saved ? "bg-ink text-white" : "bg-background text-ink",
            )}
          >
            <Heart filled={saved} />
            <span className="sr-only">{saved ? "Saved. Remove it" : "Save"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-background text-ink shadow-[0_1px_3px_rgba(22,24,26,0.25)]"
          >
            <svg width="10" height="10" viewBox="0 0 9 9" fill="none" aria-hidden>
              <path
                d="M1 1L8 8M8 1L1 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* An arrow only where there is somewhere to go. */}
        {photo > 0 ? (
          <PhotoArrow side="left" onClick={() => setPhoto((p) => p - 1)} />
        ) : null}
        {photo < count - 1 ? (
          <PhotoArrow side="right" onClick={() => setPhoto((p) => p + 1)} />
        ) : null}
        {count > 1 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-[5px]">
            {listing.photos.map((src, i) => (
              <span
                key={src + i}
                className={cn(
                  "size-1.5 rounded-full transition-opacity",
                  i === photo ? "bg-white" : "bg-white/55",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1 px-3.5 pt-3 pb-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[15px]/[22px] font-semibold text-ink">
            {listing.address}
          </span>
          <PriceDeltaChip
            askingPrice={listing.askingPrice}
            ourEstimate={listing.ourEstimate}
          />
        </div>
        <p className="text-[13px]/5 text-ink-muted">{listing.summary}</p>
        <p className="pt-1 text-[15px]/[22px] font-semibold text-ink">
          {formatCurrency(listing.askingPrice.value)}
        </p>
      </div>
    </div>
  );
}

function PhotoArrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous photograph" : "Next photograph"}
      className={cn(
        "absolute top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/95 text-ink shadow-[0_1px_3px_rgba(22,24,26,0.25)] transition-colors hover:bg-background",
        side === "left" ? "left-2.5" : "right-2.5",
      )}
    >
      <svg width="10" height="12" viewBox="0 0 8 12" fill="none" aria-hidden>
        <path
          d={side === "left" ? "M7 1L2 6l5 5" : "M1 1l5 5-5 5"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M8 13.6 C8 13.6 1.9 10.1 1.9 6.1 C1.9 4.2 3.4 2.8 5.2 2.8 C6.4 2.8 7.5 3.5 8 4.5 C8.5 3.5 9.6 2.8 10.8 2.8 C12.6 2.8 14.1 4.2 14.1 6.1 C14.1 10.1 8 13.6 8 13.6 Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
