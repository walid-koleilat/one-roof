"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { PriceDeltaChip } from "@/components/price-delta-chip";
import { formatCurrency } from "@/lib/domain/format";
import { isVerified, metricsLine, suiteLabel } from "@/lib/domain/listing";
import { MatterRow } from "@/components/matter-row";
import type { Matter } from "@/lib/domain/matters";
import type { Listing, Proof } from "@/data/listings";

/**
 * The one listing card. Every surface in this journey shows the same house,
 * so they show it the same way.
 *
 * The card argues its fit instead of reciting beds and baths: the line under
 * the address is the suite status, in blue when somebody official has checked
 * the space and in warm when nobody has. That is the whole product thesis
 * compressed into a colour, which is why it is derived from `isVerified`
 * rather than passed in as a prop a caller could get wrong.
 *
 * `density` exists because the same card has to survive three widths: 230px
 * inside a sponsored slot, 236px inside the app widget, and 430px on a search
 * page. It changes the photograph and the type scale, never the content.
 */

/**
 * `results` is the card beside the map: a row rather than a column, 212px of
 * photograph on the left and everything else in the 370px that is left. It is
 * the only density that turns on its side, because it is the only one that has
 * to sit in a 616px column next to something 540px tall.
 *
 * `grid` is the Saved page's tile, four across at about 235px. Its values are
 * `widget`'s today and it is a separate name on purpose: `widget` is drawn for
 * somebody else's assistant at 236px and will move when that does, and
 * sharing it would let the next person tuning the ChatGPT card silently
 * retune the grid. It also cannot be `saved`, which is defined by not pinning
 * the price - a uniform grid exists so prices line up.
 */
export type ListingCardDensity =
  | "ad"
  | "widget"
  | "page"
  | "saved"
  | "results"
  | "grid";

const PHOTO_HEIGHT: Record<ListingCardDensity, string> = {
  ad: "h-[158px]",
  widget: "h-[150px]",
  page: "h-[196px]",
  saved: "h-[190px]",
  // A column rather than a band: the height is the card's, and the width is
  // what is fixed. 13.25rem by 12.125rem is the 212 x 194 the design draws.
  results: "h-[12.125rem] w-[13.25rem] shrink-0",
  grid: "h-[150px]",
};

const TITLE_SIZE: Record<ListingCardDensity, string> = {
  ad: "text-sm/5",
  widget: "text-sm/5",
  page: "text-[15px]/[22px]",
  saved: "text-[17px]/[25px]",
  results: "text-base/6",
  grid: "text-[15px]/[22px]",
};

const PRICE_SIZE: Record<ListingCardDensity, string> = {
  ad: "text-[15px]/[22px]",
  widget: "text-[15px]/[22px]",
  page: "text-[17px]/[26px]",
  saved: "text-[19px]/[27px]",
  results: "text-[18px]/[26px] font-bold tracking-[-0.02em]",
  grid: "text-[18px]/[26px]",
};

export function ListingCard({
  listing,
  density = "page",
  /** The address, or the neighbourhood when we are not allowed to name it. */
  heading,
  /** Extra lines under the suite status. Form, access, whatever the surface owes. */
  lines,
  /** Pinned top-left of the photograph. A verdict or a market fact, never both. */
  tag,
  /** Pinned top-right. Save, Saved, Remove. */
  action,
  /**
   * Replaces the asking price entirely. Only Saved uses it, for a home that
   * has gone: what it sold for is a different fact from what it wanted, and
   * showing both would make the card argue with itself.
   */
  priceSlot,
  /** Her three, in place of the listing's own summary of itself. */
  matters,
  /** Drop the travel row, where the card is carrying a history instead. */
  hideTravel,
  /**
   * Drop the listing's own facts about itself: the bed-and-bath line and the
   * estimate chip beside it.
   *
   * The Saved tile is the one surface where she is not choosing between
   * strangers. She saved these eleven, she knows what they are, and what she
   * came back for is what has happened to them since. So the tile keeps the
   * address, what the suite is, the price and the last thing that happened,
   * and gives the counts back - they are one press away in the panel.
   */
  hideMetrics,
  /** Greys the photograph. A home that has sold is not a home she can see. */
  faded,
  /** Blocks under the price: a visit, a note, an income line. */
  children,
  /** Lit, because its pin was picked on the map or the pointer is over it. */
  selected,
  onSelect,
  /** Pointer only. The page uses it to light the pin on the map. */
  onHover,
  /** Lets a caller scroll this card into view when the map picks it. */
  ref,
  className,
}: {
  listing: Listing;
  density?: ListingCardDensity;
  heading?: string;
  lines?: readonly string[];
  tag?: React.ReactNode;
  action?: React.ReactNode;
  priceSlot?: React.ReactNode;
  /**
   * Her three, in place of the listing's own summary of itself.
   *
   * When this is given the card stops printing bed and bath counts and prints
   * what she asked for instead, each line measured against the number she set.
   * Derived in `mattersFor`, never assembled here: what a card is allowed to
   * claim is a rule, and rules do not live in components.
   */
  matters?: readonly Matter[];
  hideTravel?: boolean;
  hideMetrics?: boolean;
  faded?: boolean;
  children?: React.ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  onHover?: (over: boolean) => void;
  ref?: React.Ref<HTMLElement>;
  className?: string;
}) {
  const verified = isVerified(listing.suite);
  const results = density === "results";
  const page = density === "page";
  /**
   * Drawn with a hairline, and lit rather than lifted when picked.
   *
   * The card beside the map always was: in a column of thirty-one a shadow on
   * every one is noise, so it takes an edge and spends the shadow on the one
   * she is looking at. The search page's card joined it when the board drew
   * the same hairline round it - the two sit on the same page and were the
   * only cards on it behaving differently. The advert and the widget keep
   * their lift, because they sit inside somebody else's chrome where a
   * bordered box would read as a second frame.
   */
  const edged = results || page;
  const pinPrice = density !== "saved" && !results;

  // Which claim is currently showing its evidence. The photograph swaps
  // rather than a lightbox opening, because on a 236px card in somebody
  // else's assistant there is nowhere for a lightbox to go. The whole row is
  // kept, not just its photograph, because the block under the photo repeats
  // the claim beside the caption that backs it.
  const [evidence, setEvidence] = React.useState<Matter | null>(null);
  const proof = evidence?.proof ?? null;

  return (
    <article
      ref={ref}
      data-slot="listing-card"
      data-selected={selected ? "" : undefined}
      onMouseEnter={onHover ? () => onHover(true) : undefined}
      onMouseLeave={onHover ? () => onHover(false) : undefined}
      className={cn(
        // `group/card` is what keeps the photo arrows visible once the card
        // has been picked, rather than only while the pointer is over it.
        "group/card relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl bg-background duration-200 ease-out",
        edged
          ? "border border-hairline transition-[border-color,box-shadow]"
          : "transition-[transform,box-shadow]",
        results && "h-auto flex-row",
        onSelect && "cursor-pointer",
        // Inside the advert and the widget a picked card lifts off the page
        // rather than getting outlined. The shadow is blue because blue is
        // what means "this counts" everywhere else here, and it is kept faint.
        !edged &&
          (selected
            ? "-translate-y-[3px] shadow-[0_10px_22px_-8px_rgba(40,163,179,0.42)]"
            : onSelect &&
              "hover:-translate-y-[2px] hover:shadow-[0_8px_18px_-8px_rgba(22,24,26,0.22)]"),
        // On the search page the card lights and does not rise: the hairline
        // firms up and a low shadow appears, the same on hover as when its pin
        // is picked, so the two ways of pointing at a house look like one.
        edged &&
          (selected
            ? "border-hairline-strong shadow-[0_3px_12px_rgba(22,24,26,0.07)]"
            : onSelect &&
              "hover:border-hairline-strong hover:shadow-[0_3px_12px_rgba(22,24,26,0.07)]"),
        className,
      )}
    >
      <Photos
        listing={listing}
        density={density}
        heading={heading}
        tag={tag}
        action={action}
        faded={faded}
        proof={proof}
        onCloseProof={() => setEvidence(null)}
      />

      <div
        className={cn(
          "flex flex-1 flex-col gap-0.5 px-3.5 pt-2.5 pb-3.5",
          page && "gap-2 px-4 pt-3.5 pb-4",
          results && "min-w-0 gap-[7px] px-4 py-3.5",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          {/*
            The whole card is clickable, but the thing that takes focus is a
            real button around its name. An <article> with an onClick is a trap
            for anyone on a keyboard: the map's pins announce themselves and
            respond to Enter, and before this the cards did neither, so half of
            a two-way link was unreachable. The button stretches over the card
            with a pseudo-element, which is why the photo arrows carry a z-index
            - they sit above the overlay and stay independently clickable.
          */}
          <h3 className={cn("font-semibold text-ink", TITLE_SIZE[density])}>
            {onSelect ? (
              <button
                type="button"
                onClick={onSelect}
                aria-pressed={selected}
                className="text-left after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-action"
              >
                {heading ?? listing.address}
              </button>
            ) : (
              (heading ?? listing.address)
            )}
          </h3>
          {/* In the grid the chip moves under the metrics line: beside the
              name at 235px it wrapped "145 Morningside Avenue" onto three
              lines, and the name is the button. */}
          {density === "grid" ? null : (
            <PriceDeltaChip
              askingPrice={listing.askingPrice}
              ourEstimate={listing.ourEstimate}
            />
          )}
        </div>

        {matters && matters.length === 0 ? (
          // Nothing declared, nothing to measure against. The sentence and the
          // price are what a visitor with no conversation gets, and the bed
          // and bath counts stay off the card face at every density.
          <p className="text-[13px]/[19px] text-ink-body">{listing.summary}</p>
        ) : matters ? (
          <>
            {/*
              The evidence lives on the photograph: its caption is a strip
              across the bottom of the picture and its sources are a press
              away behind a small mark. Nothing joins the body, so the card
              keeps its height while she looks.
            */}
            <p className="text-[13px]/[19px] text-ink-body">
              {listing.summary}
            </p>
            <p
              className={cn(
                "pt-0.5 font-mono text-[10px] uppercase",
                edged
                  ? "font-medium tracking-[0.09em] text-ink-muted"
                  : "tracking-[0.12em] text-ink-faint",
              )}
            >
              What matters to you
            </p>
            <ul
              className={cn(
                "flex flex-col",
                edged ? "gap-2" : "gap-[7px] pt-0.5",
              )}
            >
              {matters.map((m, i) => (
                <MatterRow
                  key={m.label}
                  matter={m}
                  onProof={m.proof ? () => setEvidence(m) : undefined}
                  /*
                    The price rides the last line rather than taking one of its
                    own. On a card this short a line that says only the price
                    costs a fifth of the height to repeat what the row beside
                    it has already left room for.
                  */
                  trailing={
                    results && i === matters.length - 1 ? (
                      <span className={cn("text-ink", PRICE_SIZE.results)}>
                        {formatCurrency(listing.askingPrice.value)}
                      </span>
                    ) : undefined
                  }
                />
              ))}
            </ul>
          </>
        ) : (
          <>
            {hideMetrics ? null : (
              <p className="text-[13px]/[19px] text-ink-muted">
                {metricsLine(listing.metrics, { compact: density !== "page" })}
              </p>
            )}

            {density === "grid" && !hideMetrics ? (
              <div className="flex pt-0.5">
                <PriceDeltaChip
                  askingPrice={listing.askingPrice}
                  ourEstimate={listing.ourEstimate}
                />
              </div>
            ) : null}

            <p
              className={cn(
                "text-[13px]/[19px] font-medium",
                verified ? "text-action-deep" : "text-conf-low",
                // In the grid this line wraps at 173px on a phone, and a card
                // that grows by a line pushes its price out of the row's lane.
                // The slot is two lines whether or not the words need them;
                // design.md forbids shortening the words for the small screen.
                density === "grid" && "min-h-[38px]",
              )}
            >
              {suiteLabel(listing.suite)}
            </p>

            <ul className="mt-[3px] flex flex-col gap-[3px]">
              {(lines ?? [listing.form, listing.access]).map((line) => (
                <li key={line} className="flex items-start gap-[7px]">
                  <span
                    aria-hidden
                    className="mt-[7px] size-1 shrink-0 rounded-full bg-ink-faint"
                  />
                  {/*
                    One line each in a narrow card, where these are read at a
                    glance beside two others and a fact that wraps stops being a
                    glance. On the search page the card is twice as wide and
                    carries a whole sentence, so there it is allowed to wrap
                    rather than being cut to nothing useful.
                  */}
                  <span
                    title={line}
                    className={cn(
                      "min-w-0 text-[13px]/[19px] text-ink-muted",
                      density === "page" ? "text-balance" : "truncate",
                    )}
                  >
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {/*
          Pinned to the bottom. In a row of three, one card always has a
          shorter description than the others, and letting the slack fall
          underneath the price left it stranded in white space. The slack now
          falls above, and the prices line up across the row.
        */}
        {/*
          The price sits at the bottom in a row of comparable cards, so three
          of them line up whatever their text. On Saved it does not: the card
          carries a history, notes and a thread underneath, and pinning the
          price to the bottom of a grid row strands it in a gap the length of
          whichever neighbour had more to say.
        */}
        {results && matters ? null : priceSlot ? (
          <div
            className={cn(page ? "pt-0.5" : "pt-[3px]", pinPrice && "mt-auto")}
          >
            {priceSlot}
          </div>
        ) : (
          <p
            className={cn(
              "font-semibold text-ink",
              page ? "pt-0.5" : "pt-[3px]",
              pinPrice && "mt-auto",
              PRICE_SIZE[density],
            )}
          >
            {formatCurrency(listing.askingPrice.value)}
            {listing.previousPrice ? (
              <span className="ml-2 text-[15px]/[22px] font-normal text-ink-faint line-through">
                {formatCurrency(listing.previousPrice.value)}
              </span>
            ) : null}
          </p>
        )}

        {hideTravel || matters ? null : (
          <TravelRow
            drive={listing.driveMinutes}
            transit={listing.transitMinutes}
          />
        )}

        {children}
      </div>
    </article>
  );
}

/**
 * The photograph, and the way through the rest of them.
 *
 * The arrows stay hidden until somebody hovers or picks the card, because
 * three cards side by side with six arrow buttons between them is a control
 * panel rather than a row of houses. They also stop the click reaching the
 * card, so paging through pictures never counts as choosing the home.
 *
 * While evidence is open the frame shows the proof instead, with no arrows
 * and no dots: the caption under it says what this is, and paging away from
 * the evidence would leave the caption describing a picture that had gone.
 */
function Photos({
  listing,
  density,
  heading,
  tag,
  action,
  faded,
  proof,
  onCloseProof,
}: {
  listing: Listing;
  density: ListingCardDensity;
  heading?: string;
  tag?: React.ReactNode;
  action?: React.ReactNode;
  faded?: boolean;
  proof?: Proof | null;
  onCloseProof?: () => void;
}) {
  const [at, setAt] = React.useState(0);
  const count = listing.photos.length;
  // No wrapping round. The first photograph has nothing to its left and the
  // last nothing to its right, and the arrows say so by not being there.
  const step = (by: number) => (event: React.MouseEvent) => {
    event.stopPropagation();
    setAt((i) => Math.min(Math.max(i + by, 0), count - 1));
  };

  return (
    <div
      className={cn(
        "group/photo relative flex shrink-0 items-start justify-between overflow-hidden bg-cover bg-center p-3",
        density === "results" && "p-2.5",
        PHOTO_HEIGHT[density],
        faded && "grayscale-[0.55]",
      )}
      style={{
        backgroundColor: listing.photoTint,
        backgroundImage: `url(${proof ? proof.photo : listing.photos[at]})`,
      }}
      role="img"
      aria-label={
        proof
          ? `${heading ?? listing.address}. ${proof.caption}`
          : `${heading ?? listing.address}, photograph ${at + 1} of ${count}`
      }
    >
      {tag ?? <span />}
      {action}

      {proof ? (
        <Caption key={proof.photo} proof={proof} onClose={onCloseProof} />
      ) : null}

      {!proof && count > 1 ? (
        <>
          {at > 0 ? <Arrow side="left" onClick={step(-1)} /> : null}
          {at < count - 1 ? <Arrow side="right" onClick={step(1)} /> : null}
          <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-[5px]">
            {listing.photos.map((photo, i) => (
              <span
                key={photo + i}
                className={cn(
                  "size-[5px] rounded-full bg-background transition-opacity",
                  i === at ? "opacity-100" : "opacity-50",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * The evidence's caption, as a strip across the foot of the photograph,
 * with its sources in a tooltip on one small mark.
 *
 * The tag row under the sentence used to name the sources in the body and
 * the card grew by two lines every time a claim was pressed; a popover in
 * their place covered the picture she had just asked to see. The sources
 * are a citation rather than a claim, so they are one line over the mark,
 * on hover and focus, and on a press for a thumb: a record we did not make
 * reads as a record, a read we did reads as ours.
 */
function Caption({
  proof,
  onClose,
}: {
  proof: Proof;
  onClose?: () => void;
}) {
  const [pinned, setPinned] = React.useState(false);
  const sources = proof.sources
    .map((source) => `${source.label} (${source.computed ? "our reading" : "on record"})`)
    .join(" · ");
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 bg-ink/80 px-3 py-2 text-white backdrop-blur-[2px]">
      <span className="min-w-0 grow text-[12px]/4">{proof.caption}</span>
      <span className="group/source relative shrink-0">
        <button
          type="button"
          aria-label="Where this comes from"
          aria-describedby={`sources-${proof.photo}`}
          aria-expanded={pinned}
          onClick={(event) => {
            event.stopPropagation();
            setPinned((p) => !p);
          }}
          className="flex size-[22px] items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 7.2V11.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
          </svg>
        </button>
        <span
          id={`sources-${proof.photo}`}
          role="tooltip"
          className={cn(
            // Two short lines at most, held inside the card at every width
            // rather than one long line that runs off its left edge.
            "pointer-events-none absolute right-0 bottom-full z-30 mb-1.5 w-max max-w-[15rem] rounded-md bg-ink px-2.5 py-1.5 text-left text-[11px]/4 text-white shadow-[0_4px_12px_rgba(22,24,26,0.25)] transition-opacity",
            pinned
              ? "opacity-100"
              : "opacity-0 group-hover/source:opacity-100 group-focus-within/source:opacity-100",
          )}
        >
          {sources}
        </span>
      </span>
      {onClose ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          className="flex size-[22px] shrink-0 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white"
        >
          <svg width="10" height="10" viewBox="0 0 11 11" fill="none" aria-hidden>
            <path d="M1 1L10 10M10 1L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="sr-only">Close the evidence</span>
        </button>
      ) : null}
    </div>
  );
}

function Arrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: (event: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous photograph" : "Next photograph"}
      className={cn(
        // A white circle that appears when the pointer is over the photograph
        // and is not there otherwise, so the picture is the picture until she
        // reaches for it. Always there on a phone, where there is no hover.
        "absolute top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background text-ink shadow-[0_1px_3px_rgba(22,24,26,0.25)] transition-opacity duration-150",
        "opacity-0 group-hover/photo:opacity-100 focus-visible:opacity-100",
        // No hover on a phone, so the arrows are simply always there. Without
        // this the only way to open a carousel on touch is to select the card,
        // which also moves the map pin - and browsing photographs would become
        // the same gesture as choosing a house.
        "[@media(hover:none)]:opacity-70",
        side === "left" ? "left-2.5" : "right-2.5",
      )}
    >
      <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden>
        <path
          d={side === "left" ? "M10 3.5 L5.5 8 L10 12.5" : "M6 3.5 L10.5 8 L6 12.5"}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/**
 * Minutes to the hospital and to a bus, on their own row, each named.
 *
 * She asked for this twice - her mother does not drive - so it does not get to
 * live at the end of a sentence about the shape of the building.
 *
 * The destinations are written out. An earlier version showed "8 min" beside a
 * cross and "2 min" beside a bus and left the reader to work out that the
 * first was a drive to Scarborough General and the second a walk to a stop:
 * two numbers with no nouns. The icons still carry the map's layer colours, so
 * somebody who has looked at the pins recognises the system, but they
 * reinforce the words now rather than standing in for them.
 */
function TravelRow({ drive, transit }: { drive: number; transit: number }) {
  return (
    <div className="mt-1.5 flex w-fit flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-sunken px-2.5 py-1.5">
      <Leg
        label="Hospital"
        minutes={drive}
        detail="by car, to Scarborough General"
        icon={
          <path
            d="M6.4 2.4 H9.6 V6.4 H13.6 V9.6 H9.6 V13.6 H6.4 V9.6 H2.4 V6.4 H6.4 Z"
            fill="var(--layer-health)"
          />
        }
      />
      <Leg
        label="Bus"
        minutes={transit}
        detail="on foot, to the nearest stop"
        icon={
          <>
            <rect x="2.6" y="2.4" width="10.8" height="9" rx="2.2" fill="var(--layer-transit)" />
            <rect x="4.4" y="4.4" width="7.2" height="3.4" rx="1" fill="#FFFFFF" />
            <circle cx="5.2" cy="13" r="1.5" fill="var(--layer-transit)" />
            <circle cx="10.8" cy="13" r="1.5" fill="var(--layer-transit)" />
          </>
        }
      />
    </div>
  );
}

/**
 * One leg, kept whole.
 *
 * The icon, the place and the number never separate. An earlier version put a
 * hairline between the two legs, which was fine on a wide card and stranded
 * the divider at the end of the first line on a narrow one. Two self-contained
 * groups wrap without leaving anything behind.
 */
function Leg({
  label,
  minutes,
  detail,
  icon,
}: {
  label: string;
  minutes: number;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <svg width="13" height="13" viewBox="0 0 16 16" className="shrink-0" aria-hidden>
        {icon}
      </svg>
      <span className="text-xs/[18px] text-ink">
        {label} <span className="font-semibold">{minutes} min</span>
        <span className="sr-only"> {detail}</span>
      </span>
    </span>
  );
}
