"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Wordmark } from "@/components/wordmark";
import { ListingCard } from "@/components/listing-card";
import { mattersFor } from "@/lib/domain/matters";
import { Exit } from "@/components/exit-hint";
import {
  PriceMap,
  SHAPE_COLOUR,
  type PinShape,
} from "@/components/price-map";
import { spelled } from "@/lib/domain/format";
import { cn } from "@/lib/utils";
import { AD_MAP_VIEWBOX, AD_PINS } from "@/data/ad-map";
import { AD_LISTINGS, AREA_SHAPES, AREA_TOTAL } from "@/data/listings";

/**
 * The sponsored card. It may not name a house.
 *
 * VOW Rule 8.18 forbids providing listing information "to any person or
 * entity", and an ad slot is exactly that: a surface rendered by somebody
 * else's product to a user who has not asked One Roof for anything. So the
 * pins sit over neighbourhoods, the cards are headed "Bendale" rather than
 * "64 Ellendale Drive", and the addresses stay behind the door.
 *
 * That constraint is not a limitation being worked around. It is the reason
 * the widget further down the page feels like an answer: the ad argues that a
 * market exists, and the widget, invoked by name, is allowed to be specific.
 *
 * The map is the search page's map at a quarter of the size - same boundary,
 * same pins, same place filters - because the promise of the ad is that this
 * is what the product is actually like.
 */

/** The area she would have drawn, in the map's own coordinates. */
const BENDALE_BOUNDARY =
  "M92 88 L250 44 L420 58 L560 96 L604 190 L520 286 L330 322 L152 282 L74 176 Z";


export function SponsoredCard() {
  const [selected, setSelected] = useState<string | null>(AD_LISTINGS[1]!.id);
  /**
   * Shapes she has switched off. The key became a filter because a legend
   * that only explains is a caption, and the counts on it were the one thing
   * on this card worth pressing.
   */
  const [off, setOff] = useState<readonly PinShape[]>([]);
  const cards = useRef(new Map<string, HTMLElement | null>());

  const toggleShape = (shape: PinShape) =>
    setOff((current) =>
      current.includes(shape)
        ? current.filter((s) => s !== shape)
        : [...current, shape],
    );

  const drawn = AD_PINS.filter((pin) => !off.includes(pin.shape));

  /**
   * Picking the thing that is already picked unpicks it.
   *
   * Without this there is no way back to "none of these": one card stays
   * lifted for the rest of the session whatever she does, which quietly
   * asserts a preference she never expressed.
   */
  const toggle = (id: string) =>
    setSelected((current) => (current === id ? null : id));

  /**
   * From the map, the answer appears somewhere she is not looking.
   *
   * A pin press lifts a card three pixels, and on a narrow screen the cards
   * are stacked below the map, so the feedback lands off the fold. `nearest`
   * does nothing when the card is already visible, which is why it does not
   * fight the transcript scrolling itself during playback.
   */
  const pick = (id: string) => {
    toggle(id);
    if (selected === id) return; // Being unpicked. Nothing to bring into view.
    cards.current
      .get(id)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <section
      aria-label="Sponsored by One Roof"
      className="@container flex flex-col overflow-hidden rounded-2xl border border-gpt-hairline bg-background"
    >
      <header className="flex items-center gap-2.5 px-[18px] py-3.5">
        <Wordmark />
        <span className="rounded-full bg-[#F0F0F0] px-2.5 py-[3px] text-[11px]/[15px] font-medium text-gpt-muted">
          Ad
        </span>
        <span aria-hidden className="text-[13px] font-semibold text-gpt-faint">
          ...
        </span>
      </header>

      <div className="flex flex-col gap-[3px] px-[18px] pb-3">
        <h2 className="text-base/[23px] font-semibold text-gpt-ink">
          Homes big enough for you and your parents
        </h2>
        <p className="text-sm/[21px] text-gpt-muted">
          <span className="capitalize">{spelled(AREA_TOTAL)}</span> in
          Scarborough, in {spelled(AREA_SHAPES.length)} different shapes.
        </p>
      </div>

      <div className="px-[18px] pb-2.5">
        <PriceMap
          viewBox={`0 0 ${AD_MAP_VIEWBOX.width} ${AD_MAP_VIEWBOX.height}`}
          image="/homes/map-scarborough.jpg"
          className="rounded-[14px]"
          title="Eleven homes across Bendale and the neighbourhoods around it, in three shapes"
          boundary={BENDALE_BOUNDARY}
          labelBy="shape"
          tallOnNarrow
          selectedId={selected}
          onSelect={pick}
          labels={[
            { x: 300, y: 128, text: "BENDALE", primary: true },
            { x: 618, y: 76, text: "WOBURN" },
            { x: 104, y: 300, text: "CEDARBRAE" },
          ]}
          places={[
            {
              x: 338,
              y: 210,
              label: "Scarborough General",
              kind: "health" as const,
            },
            { x: 140, y: 148, label: "Bus to Kennedy", kind: "transit" as const },
            {
              x: 556,
              y: 330,
              label: "Temple",
              kind: "worship" as const,
            },
          ]}
          // Solid if it has a card below, light if it does not. The three
          // she can read about are the three that look clickable.
          pins={drawn.map((pin) => ({
            ...pin,
            state: pin.id ? ("listed" as const) : ("nearby" as const),
          }))}
        >
          <ShapeFilters off={off} onToggle={toggleShape} showing={drawn.length} />
          <MapControls />
        </PriceMap>
      </div>

      <p className="px-[18px] pb-3.5 text-xs/[18px] text-ink-muted">
        Pick a pin or a card. The other one follows.
      </p>

      {/*
        Fixed-width cards in a scroller, not a fluid grid.
        Three at 235 plus two 12px gaps is 729, and the advert has 730 inside
        its padding - so on a full-width thread they fit exactly and nothing
        scrolls. Under 520 they stack instead: a phone has no room to scroll
        a row sideways and read a three-line list inside it. Narrower than that they scroll instead of being
        squeezed: the card was drawn at 236, and at 175 the thumbnail beside
        each claim stops being legible. The clipped edge is the signal that
        there is more, which is what the app guidelines ask for anyway.
      */}
      <div className="flex flex-col gap-3 px-[18px] pb-[18px] @min-[520px]:flex-row @min-[520px]:snap-x @min-[520px]:snap-mandatory @min-[520px]:overflow-x-auto @min-[520px]:[scrollbar-width:none] @min-[520px]:[&::-webkit-scrollbar]:hidden">
        {AD_LISTINGS.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            density="ad"
            className="w-full @min-[520px]:w-[235px] @min-[520px]:shrink-0 @min-[520px]:snap-start"
            heading={listing.neighbourhood}
            matters={mattersFor(listing)}
            faded={off.includes(shapeOf(listing))}
            selected={selected === listing.id}
            onSelect={() => toggle(listing.id)}
            ref={(node) => {
              cards.current.set(listing.id, node);
            }}
          />
        ))}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 px-[18px] pb-[18px]">
        <p className="text-xs/[18px] text-ink-muted">
          Drive times are measured from each front door. Interiors are
          illustrations, not photographs of these homes.
        </p>
        <Exit>
          <Link
            href="/homes-with-a-suite"
            className="flex items-center gap-1.5 rounded-full px-1 text-[13px]/[19px] font-semibold text-action-deep underline-offset-4 hover:underline"
          >
            See all {AREA_TOTAL} in One Roof
            <span aria-hidden>&rsaquo;</span>
          </Link>
        </Exit>
      </footer>
    </section>
  );
}

/**
 * What the coloured dot inside each pin means.
 *
 * Without it the map draws eleven identical pins under a headline promising
 * three shapes. With it the mix is visible rather than asserted, and the
 * scarcity the assistant described - the shape that costs the most is four of
 * eleven - is something she can count.
 */
/** Which of the three shapes a home counts as, for the filter. */
function shapeOf(listing: (typeof AD_LISTINGS)[number]): PinShape {
  if (listing.suite === "could-convert") return "convert";
  if (listing.suite === "ground-floor") return "ground";
  return "suite";
}

/**
 * The key, made pressable, and pinned to the map rather than floating under it.
 *
 * Cut the context, never the count: switching a shape off takes its pins off
 * the drawing and greys its card, and the number on the right moves with it.
 * A legend that cannot be pressed is a caption, and the counts were the only
 * thing on this map anybody wanted to check.
 */
function ShapeFilters({
  off,
  onToggle,
  showing,
}: {
  off: readonly PinShape[];
  onToggle: (shape: PinShape) => void;
  showing: number;
}) {
  return (
    <div className="absolute bottom-3 left-3 flex w-fit max-w-[calc(100%-24px)] flex-nowrap items-center gap-1.5 overflow-x-auto rounded-full bg-background p-1.5 shadow-[0_4px_14px_-4px_rgba(22,24,26,0.30)] [scrollbar-width:none] sm:bottom-4 sm:left-4 [&::-webkit-scrollbar]:hidden">
      {AREA_SHAPES.map((s) => {
        const shape = s.shape as PinShape;
        const on = !off.includes(shape);
        return (
          <button
            key={s.shape}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(shape)}
            className={cn(
              "flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs/[18px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action",
              on
                ? "border-[color:var(--chip)] bg-[color:var(--chip-tint)] text-ink"
                : "border-hairline bg-background text-ink-faint",
            )}
            style={
              {
                "--chip": SHAPE_COLOUR[shape],
                "--chip-tint": `${SHAPE_COLOUR[shape]}1F`,
              } as React.CSSProperties
            }
          >
            <span
              aria-hidden
              className="size-[7px] shrink-0 rounded-full"
              style={{
                backgroundColor: on ? SHAPE_COLOUR[shape] : "var(--ds-ink-faint)",
              }}
            />
            {s.count} {s.label}
          </button>
        );
      })}
      <span className="h-5 w-px shrink-0 bg-hairline" aria-hidden />
      <span className="shrink-0 px-2.5 text-xs/[18px] font-medium whitespace-nowrap text-ink-muted">
        Showing {showing}
      </span>
    </div>
  );
}

/**
 * Zoom and expand, in the corner where a map keeps them.
 *
 * Without them the panel reads as a picture of a map, and nobody tries to
 * press a picture. They are drawn but inert: J1 is a transcript of something
 * that already happened, and a working zoom here would be the fake typing the
 * rest of this prototype refuses.
 *
 * They come off below 520, where the map is only 160px tall and they would sit
 * on top of the filter row. A phone pinches to zoom and has never needed a
 * plus button to be told so.
 */
function MapControls() {
  return (
    <div
      aria-hidden
      className="absolute top-3 right-3 hidden w-8 flex-col gap-2 @min-[520px]:flex sm:top-4 sm:right-4"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-background shadow-[0_2px_8px_-2px_rgba(22,24,26,0.30)]">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 1H1v4M9 1h4v4M13 9v4H9M1 9v4h4" stroke="var(--ds-ink-body)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="flex w-8 flex-col overflow-hidden rounded-lg bg-background shadow-[0_2px_8px_-2px_rgba(22,24,26,0.30)]">
        <span className="flex size-8 items-center justify-center">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v11M1 6.5h11" stroke="var(--ds-ink-body)" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <span className="h-px bg-hairline" />
        <span className="flex size-8 items-center justify-center">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M1 6.5h11" stroke="var(--ds-ink-body)" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      </span>
    </div>
  );
}
