import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Prices on a map. The same pin on every surface that has a map.
 *
 * A pin has three looks and only three. Inside the search it is a white pill
 * with a soft shadow and a blue dot; the one whose card she is on is ink; and
 * a home outside the count she is watching is white too, but its dot fades
 * and its word goes grey. No strokes anywhere: the pill sits on the map the
 * way a card sits on the page, lifted rather than outlined.
 *
 * The blue dot is not decoration. It is the same blue that means "this counts"
 * everywhere else in the product - the permit line on a card, the saved heart
 * in the corner - so a pin that has one is making the same claim a card does.
 *
 * The component is sized by its viewBox rather than by pixels, so the strip in
 * a 730px ad slot and the full-bleed band on the search page are the same
 * drawing at two scales.
 */

/**
 * Whether the home behind this pin has a card underneath the map.
 *
 * On the search map every pin is `listed`: a home with no card has no pin,
 * because a fourth look for "on the map but not in the list" was a
 * distinction nobody could read at a glance. The advert still draws eleven
 * pins over three cards, so it keeps `nearby` for the eight she would have to
 * open One Roof to see. Those take the quiet look, with the word in grey.
 */
export type PinState = "listed" | "nearby" | "selected";

/** Whether a pin carries its price or the shape of the home. */
export type PinLabel = "price" | "shape";

/**
 * Which of the three shapes a pin is.
 *
 * The dot inside the pin is the only place on the map where the shape of a
 * building is visible. Eleven identical pins under a headline promising three
 * shapes is an assertion; eleven pins in three colours is a count she can do
 * herself, which is the difference between being told and being shown.
 */
export type PinShape = "suite" | "ground" | "convert";

/**
 * What a pin says, when the price is not the thing that separates them.
 *
 * On the advert the eleven prices run from $1.09m to $1.42m and she has not
 * named a budget yet, so every pin was saying the same thing in a slightly
 * different way. The shape is what she has spent the whole conversation
 * learning to tell apart, so that is what goes in the pill.
 */
export const SHAPE_LABEL: Record<PinShape, string> = {
  suite: "Suite",
  ground: "Ground floor",
  convert: "Could convert",
};

/**
 * The advert's legend colours. Three counts a reader can verify by eye.
 *
 * The advert's chip row pairs each colour with a count, and the search bar's
 * shape chips do the same, so on both maps the dot inside a pin can be read
 * against a legend that is already on the page.
 */
export const SHAPE_COLOUR: Record<PinShape, string> = {
  suite: "#2F5FB3",
  ground: "#9AA0A5",
  convert: "#D89A4E",
};

/** The for-sale marker, and the same marker faded for what sits outside the total. */
const SALE_DOT = "#2F5FB3";
const SALE_DOT_OUTSIDE = "#9BD3DA";

/**
 * The pill's box, from its word.
 *
 * Ten in, a 7px dot, a 7px gap, the word, thirteen out; Poppins 600 at 12px
 * runs about 6.4px a glyph. Exported so the bounds tests derive the width the
 * way the drawing does, instead of carrying a copy that goes on passing after
 * the padding changes.
 */
export const PIN_HEIGHT = 30;
/** Below this many CSS pixels across, pins are dots rather than pills. */
const NARROW_FRAME = 480;
export function pinWidth(label: string): number {
  return Math.round(label.length * 6.4) + 37;
}

/**
 * Lift, not outline. One shadow per look, and the selected one is the only
 * thing on the map allowed to be loud.
 */
const PIN_SHADOW = {
  in: "drop-shadow(0 2px 7px rgba(22,24,26,0.18))",
  selected: "drop-shadow(0 4px 14px rgba(22,24,26,0.32))",
  out: "drop-shadow(0 2px 6px rgba(22,24,26,0.12))",
} as const;

export interface MapPin {
  /** Ties the pin to a card. Undefined for a home with no card on screen. */
  id?: string;
  x: number;
  y: number;
  price: string;
  state: PinState;
  /** Colours the dot. Defaults to the shape she asked for. */
  shape?: PinShape;
}

/** The kinds of place she named. Each has a colour and a glyph. */
export type PlaceKind = "health" | "transit" | "worship" | "grocery" | "parks";

/**
 * The colours are the markers.
 *
 * These are the Nearby drawer's badges and the card's drive-time glyphs, and the
 * only per-category colours left in the product. The badges on the map itself
 * are ink-outlined, because a map with five coloured blobs on it needs a
 * legend and a map with five small white badges does not. Mirrors the
 * `--layer-*` tokens in globals.css.
 */
export const PLACE_COLOUR: Record<PlaceKind, string> = {
  health: "#C62828",
  transit: "#B0357A",
  worship: "#7B4EA8",
  grocery: "#B0761E",
  parks: "#3D7A4C",
};

export interface MapPlace {
  /** The centre of the badge. The label, if any, hangs off its right edge. */
  x: number;
  y: number;
  kind: PlaceKind;
  /** The name beside the badge. A bus stop has none: the badge is the whole mark. */
  label?: string;
  /**
   * Drawn in ink rather than grey. One place of a kind can lead: the hospital
   * every card's drive time is measured to, so the one that matters reads
   * first and the other one recedes.
   */
  named?: boolean;
}

export interface MapLabel {
  x: number;
  y: number;
  text: string;
  /** The neighbourhood the search is in. Larger, and slightly less faded. */
  primary?: boolean;
}

export function PriceMap({
  viewBox,
  image,
  pins,
  places = [],
  labels = [],
  selectedId,
  /**
   * The home the pointer is over in the list, if any. It lights the pin the
   * same way selection does: the design has three pin states and a fourth
   * for "nearly" would be a distinction nobody could read at a glance.
   */
  hoveredId,
  onSelect,
  /** Pointer only. Called with null on leave. */
  onHover,
  /** SVG path for the drawn area. Dashed blue, filled at 7%. */
  boundary,
  /** What the pills say. Price by default; the advert passes "shape". */
  labelBy = "price",
  /**
   * Draw the dots as the brand's for-sale marker rather than as route colours,
   * and mark the route that sits outside the count.
   *
   * The search map asks for this and the advert does not, because the two maps
   * are answering different questions. The advert has to prove a number, so
   * its dots are a legend and its chip row pairs each colour with a count. The
   * search map has a live total on the bar above it and a word inside every
   * pin, so colour has nothing left to say about the route - and design.md
   * spends blue on one thing here, which is a home that is for sale.
   *
   * Could convert is the exception, because those homes are deliberately
   * outside the total she is watching. Its dot fades and its pill takes a
   * leading plus, the same plus the route pills use for the same reason.
   */
  saleDots = false,
  /**
   * Give the map a taller frame on a narrow column, zooming in rather than
   * letterboxing. At 313px the natural 730x380 leaves a 163px strip nobody can
   * read, and the pins sit at 43% of the size they were drawn at. A 3:2 frame
   * with the drawing scaled to cover puts them back to a legible size, and the
   * crop lands outside every pin: the leftmost is at x 118 and the rightmost
   * ends at 639, inside the 82-648 that stays visible.
   */
  tallOnNarrow = false,
  /**
   * Fill the frame, cropping the drawing, at whatever scale that takes.
   * `tallOnNarrow` is this with a fixed aspect; this one takes the frame's.
   */
  cover = false,
  /**
   * Keep pins and place badges at the size they were drawn, whatever scale
   * the drawing renders at. A map that fills a tall column renders small,
   * and a pin that shrank with it would be unreadable; a map zoomed in
   * renders large, and a pin that grew with it would cover the street. Real
   * maps hold their markers at one size and move the map under them, and
   * this does the same by measuring the drawing's scale and counter-scaling
   * each marker at its anchor.
   */
  constantPins = false,
  /**
   * The smallest scale the drawing may render at, in CSS pixels per unit,
   * when it is covering a frame. A narrow frame would otherwise shrink the
   * whole canvas until constant-size pins sat on top of each other; under
   * this the map crops to the part with the pins in it instead, which is
   * what a real map does when it opens on a phone.
   */
  minUnit,
  title,
  className,
  children,
}: {
  viewBox: string;
  image: string;
  pins: readonly MapPin[];
  places?: readonly MapPlace[];
  labels?: readonly MapLabel[];
  /** The pin drawn as selected. Owned by the caller, not by the map. */
  selectedId?: string | null;
  hoveredId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  boundary?: string;
  /**
   * What the pills say. The advert passes "shape", because it is proving a
   * count of three shapes. The search map passes "price", the way every map
   * she has used labels a home, and carries the shape in the dot.
   */
  labelBy?: PinLabel;
  saleDots?: boolean;
  /**
   * Give the map a taller frame on a narrow column, zooming in rather than
   * letterboxing. At 313px the natural 730x380 leaves a 163px strip nobody can
   * read. A 3:2 frame with the drawing scaled to cover puts the pins back to a
   * legible size, and the crop lands outside every one of them.
   */
  tallOnNarrow?: boolean;
  cover?: boolean;
  constantPins?: boolean;
  minUnit?: number;
  /** Read out to anyone who cannot see the map. */
  title: string;
  className?: string;
  /** Overlaid chrome: filters, the draw control, the legend. */
  children?: React.ReactNode;
}) {
  const svg = useRef<SVGSVGElement>(null);
  /** CSS pixels per drawing unit, as the drawing is currently rendered. */
  const [unit, setUnit] = useState(1);
  /**
   * The frame is too narrow for pills. Seven priced pills over a phone-wide
   * map lie across each other and across the places, so below this the pin
   * is its dot and the price waits on the card a press raises.
   */
  const [narrow, setNarrow] = useState(false);
  /** The part of the canvas in view, when `minUnit` has cropped it. */
  const [view, setView] = useState<Box | null>(null);
  const slice = tallOnNarrow || cover;
  const canvas = parseBox(viewBox);
  // Where the crop centres: the pins, when there are any.
  const focus = focusOf(pins, canvas);

  useLayoutEffect(() => {
    const el = svg.current;
    if (!constantPins || !el || typeof ResizeObserver === "undefined") return;
    // ResizeObserver reports once on observe, so the first measurement
    // arrives the same way every later one does.
    const observer = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!canvas.width || !w) return;
      setNarrow(w < NARROW_FRAME);
      let box: Box | null = null;
      let scale = slice
        ? Math.max(w / canvas.width, h / canvas.height)
        : w / canvas.width;
      if (slice && minUnit !== undefined && scale < minUnit) {
        const width = Math.min(canvas.width, w / minUnit);
        const height = Math.min(canvas.height, h / minUnit);
        box = {
          x: clamp(focus.x - width / 2, canvas.x, canvas.x + canvas.width - width),
          y: clamp(focus.y - height / 2, canvas.y, canvas.y + canvas.height - height),
          width,
          height,
        };
        scale = Math.max(w / width, h / height);
      }
      setView((current) => (sameBox(current, box) ? current : box));
      setUnit((current) =>
        Math.abs(current - scale) < 0.002 ? current : scale,
      );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [constantPins, slice, minUnit, canvas.x, canvas.y, canvas.width, canvas.height, focus.x, focus.y]);

  const k = constantPins ? 1 / unit : 1;
  const shown = view ?? canvas;
  const anchored = (x: number, y: number) => `translate(${x} ${y}) scale(${k})`;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-cover bg-center",
        tallOnNarrow && "aspect-[3/2] @min-[520px]:aspect-[73/38]",
        cover && "h-full w-full",
        className,
      )}
      // In cover mode the art is drawn inside the svg, so a crop moves the
      // art and the pins together. Elsewhere it stays the frame's background.
      style={cover ? undefined : { backgroundImage: `url(${image})` }}
    >
      <svg
        ref={svg}
        viewBox={`${shown.x} ${shown.y} ${shown.width} ${shown.height}`}
        className={cn("w-full", slice && "h-full")}
        preserveAspectRatio={slice ? "xMidYMid slice" : undefined}
        role="img"
        aria-label={title}
      >
        {cover ? (
          <image
            href={image}
            x={canvas.x}
            y={canvas.y}
            width={canvas.width}
            height={canvas.height}
            preserveAspectRatio="none"
          />
        ) : null}
        {boundary ? (
          <path
            d={boundary}
            fill="#2F5FB312"
            stroke="#2F5FB3"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeDasharray="9 7"
          />
        ) : null}

        {labels.map((label) => (
          <text
            key={label.text}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            fontSize={label.primary ? 19 : 13}
            fontWeight={label.primary ? 600 : 500}
            letterSpacing={label.primary ? 3.4 : 2.2}
            fill="#16181A"
            opacity={label.primary ? 0.34 : 0.24}
          >
            {label.text}
          </text>
        ))}

        {places.map((place) => (
          <g
            key={`${place.kind}:${place.x}:${place.y}`}
            transform={anchored(place.x, place.y)}
          >
            <Place {...place} x={0} y={0} />
          </g>
        ))}

        {pins.map((pin) => (
          <g key={pin.id ?? `${pin.x}-${pin.y}`} transform={anchored(pin.x, pin.y)}>
          <Pin
            {...pin}
            x={0}
            y={0}
            labelBy={labelBy}
            saleDots={saleDots}
            compact={constantPins && narrow}
            state={
              pin.id && (selectedId === pin.id || hoveredId === pin.id)
                ? "selected"
                : pin.state
            }
            pressed={Boolean(pin.id) && selectedId === pin.id}
            onSelect={pin.id && onSelect ? () => onSelect(pin.id!) : undefined}
            onHover={
              pin.id && onHover
                ? (over) => onHover(over ? pin.id! : null)
                : undefined
            }
          />
          </g>
        ))}
      </svg>
      {children}
    </div>
  );
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function parseBox(viewBox: string): Box {
  const [x = 0, y = 0, width = 0, height = 0] = viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  return { x, y, width, height };
}

/** The centre of the pins' bounding box, or of the canvas when there are none. */
function focusOf(pins: readonly MapPin[], canvas: Box): { x: number; y: number } {
  if (pins.length === 0) {
    return { x: canvas.x + canvas.width / 2, y: canvas.y + canvas.height / 2 };
  }
  const xs = pins.flatMap((p) => [p.x, p.x + pinWidth(p.price)]);
  const ys = pins.flatMap((p) => [p.y, p.y + PIN_HEIGHT]);
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}

function sameBox(a: Box | null, b: Box | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    Math.abs(a.x - b.x) < 0.5 &&
    Math.abs(a.y - b.y) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

function Pin({
  id,
  x,
  y,
  price,
  state,
  shape,
  labelBy = "price",
  saleDots = false,
  /** Just the dot, on a frame too narrow for the pill. The price is still read out. */
  compact = false,
  /** Actually chosen, as opposed to lit because the pointer is on its card. */
  pressed = false,
  onSelect,
  onHover,
}: MapPin & {
  labelBy?: PinLabel;
  saleDots?: boolean;
  compact?: boolean;
  pressed?: boolean;
  onSelect?: () => void;
  onHover?: (over: boolean) => void;
}) {
  const selected = state === "selected";
  const route = shape ?? "suite";
  const outside = saleDots && route === "convert";
  // Off the list she is reading: outside the count on the search map, or
  // without a card on the advert. Either way the word goes quiet.
  const quiet = outside || state === "nearby";
  const look = selected ? "selected" : quiet ? "out" : "in";
  const word = outside ? `+ ${SHAPE_LABEL[route]}` : SHAPE_LABEL[route];
  const label = labelBy === "shape" ? word : price;
  // The pill fits its word. It never resizes on selection - a selected pin
  // that grows shoves its neighbours out of the way and reads as a bug - but
  // "Could convert" cannot live in the same box as "$1.19m".
  const w = pinWidth(label);
  const h = PIN_HEIGHT;

  return (
    <g
      data-pin={id}
      onClick={onSelect}
      onMouseEnter={onHover ? () => onHover(true) : undefined}
      onMouseLeave={onHover ? () => onHover(false) : undefined}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-pressed={onSelect ? pressed : undefined}
      aria-label={onSelect ? `Show the home asking ${price}` : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      className={cn(onSelect && "cursor-pointer focus:outline-none")}
    >
      {compact ? (
        /*
          The pin as its dot alone: a white disc under the same shadow the
          pill carries, the colour inside it. The disc keeps the pill's dot
          exactly where it was, so a frame that widens grows a pill out of
          the dot rather than jumping.
        */
        <>
          <circle
            cx={x + 13.5}
            cy={y + h / 2}
            r={9}
            fill={selected ? "#16181A" : "#FFFFFF"}
            style={{ filter: PIN_SHADOW[look] }}
          />
          <circle
            cx={x + 13.5}
            cy={y + h / 2}
            r={4}
            fill={
              saleDots
                ? selected
                  ? "#FFFFFF"
                  : outside
                    ? SALE_DOT_OUTSIDE
                    : SALE_DOT
                : SHAPE_COLOUR[route]
            }
          />
        </>
      ) : (
        <>
      {/*
            Selection is the pill going to ink under a deeper shadow, and nothing
            else. A halo around it was the loudest thing on the map, which put the
            emphasis on the act of clicking rather than on the home that was
            clicked; and the pill keeps its box, so the map does not shuffle.
          */}
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            rx={h / 2}
            fill={selected ? "#16181A" : "#FFFFFF"}
            style={{ filter: PIN_SHADOW[look] }}
          />
          <circle
            cx={x + 13.5}
            cy={y + h / 2}
            r={3.5}
            // The dot keeps its colour whether or not the home has a card, because
            // the advert's key counts all eleven and a grey dot would make three of
            // the counts impossible to verify. On a selected pin the ink pill has
            // already said which home this is, so a blue dot on it would be the
            // second thing saying so; white is the quieter of the two.
            fill={
              saleDots
                ? selected
                  ? "#FFFFFF"
                  : outside
                    ? SALE_DOT_OUTSIDE
                    : SALE_DOT
                : SHAPE_COLOUR[route]
            }
          />
          <text
            x={x + 24}
            y={y + h / 2 + 4.5}
            fontSize={12}
            fontWeight={600}
            fill={selected ? "#FFFFFF" : quiet ? "#6B7075" : "#16181A"}
          >
            {label}
          </text>
        </>
      )}
    </g>
  );
}

/**
 * How much of the drawing a place takes up, label and all.
 *
 * Exported for the data test that keeps every marker clear of every pin. The
 * widths are the same estimates the drawing uses, so a marker the test says
 * is clear is clear on screen too.
 */
export function placeBox(place: MapPlace): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const { x, y, kind, label } = place;
  if (kind === "transit") return { x: x - 11, y: y - 11, width: 22, height: 22 };
  const pill = label ? 6 + placeLabelWidth(place) : 0;
  return { x: x - 12, y: y - 12, width: 24 + pill, height: 24 };
}

/**
 * The label pill fits its name. Poppins at 11px runs about 6.3px a glyph and
 * a touch more in the ink weight; the temples' 12px labels run about 6.8.
 */
function placeLabelWidth({ kind, label = "", named = false }: MapPlace): number {
  if (kind === "health") {
    return Math.round(label.length * (named ? 6.5 : 6.3)) + 21;
  }
  return Math.round(label.length * 6.8) + 17;
}

/**
 * A place she named: a small white badge with its own glyph, and its name in
 * a pill beside it.
 *
 * A coloured dot needs a legend. A cross, a bus and a temple do not, and the
 * same marks sit on the drive-time row of every card, so a reader who has
 * learned them once on the map has learned them everywhere. The badges are
 * ink-outlined rather than coloured: the colour lives in the Nearby drawer,
 * where it pairs a row with a mark, and on the map the mark can stand alone.
 */
function Place(place: MapPlace) {
  const { x, y, kind, label, named = false } = place;
  if (kind === "transit") return <TransitStop x={x} y={y} />;

  const hospital = kind === "health";
  // The lead hospital is ink; the other one takes the muted grey the board
  // gives it, so the two do not compete. Everything else sits on a hairline.
  const rim = hospital ? (named ? "#16181A" : "#5C6066") : "#DFE2E4";

  return (
    <g aria-hidden>
      <rect
        x={x - 12}
        y={y - 12}
        width={24}
        height={24}
        rx={6}
        fill="#FFFFFF"
        stroke={rim}
        strokeWidth={hospital ? 1.7 : 1}
      />
      {hospital ? (
        <path
          d={`M${x} ${y - 6} L${x} ${y + 6} M${x - 6} ${y} L${x + 6} ${y}`}
          fill="none"
          stroke={rim}
          strokeWidth={1.9}
          strokeLinecap="round"
        />
      ) : kind === "worship" ? (
        <path
          transform={`translate(${x - 6.5} ${y - 6.5}) scale(${13 / 14})`}
          d="M7 1.4L11.2 5.6H9.8V12.2H4.2V5.6H2.8L7 1.4Z"
          fill="none"
          stroke={PLACE_COLOUR.worship}
          strokeWidth={1.3}
          strokeLinejoin="round"
        />
      ) : (
        <g transform={`translate(${x - 6.4} ${y - 6.4}) scale(0.8)`}>
          <PlaceGlyph kind={kind} colour={PLACE_COLOUR[kind]} />
        </g>
      )}
      {label ? <PlaceLabel {...place} label={label} /> : null}
    </g>
  );
}

/**
 * The name beside a badge.
 *
 * A hospital's name is a small grey caption, or ink when it is the one that
 * leads. A temple's is a plain white plate in the body colour, because it is
 * the thing the front door promised and the word is what she is looking for.
 */
function PlaceLabel(place: MapPlace & { label: string }) {
  const { x, y, kind, label, named = false } = place;
  const width = placeLabelWidth(place);
  const left = x + 18;
  if (kind === "health") {
    return (
      <>
        <rect
          x={left}
          y={y - 12}
          width={width}
          height={24}
          rx={12}
          fill={named ? "#16181A" : "#FFFFFF"}
          stroke={named ? "none" : "#DFE2E4"}
        />
        <text
          x={left + 11}
          y={y + 4}
          fontSize={11}
          fontWeight={named ? 600 : 500}
          fill={named ? "#FFFFFF" : "#5C6066"}
        >
          {label}
        </text>
      </>
    );
  }
  return (
    <>
      <rect
        x={left}
        y={y - 12}
        width={width}
        height={24}
        rx={6}
        fill="#FFFFFF"
        stroke="#DFE2E4"
      />
      <text x={left + 8} y={y + 4.5} fontSize={12} fontWeight={500} fill="#16181A">
        {label}
      </text>
    </>
  );
}

/**
 * A bus stop. A 22px ring with a bus in it and no name, because four of them
 * along the main roads say "the bus runs here" and a name on each would say
 * nothing she can act on.
 */
function TransitStop({ x, y }: { x: number; y: number }) {
  return (
    <g aria-hidden>
      <circle cx={x} cy={y} r={11} fill="#FFFFFF" stroke="#16181A" strokeWidth={1.4} />
      <rect
        x={x - 3.6}
        y={y - 4.4}
        width={7.2}
        height={6.2}
        rx={1.6}
        fill="none"
        stroke="#16181A"
        strokeWidth={1.1}
      />
      <circle cx={x - 1.8} cy={y + 4.2} r={0.9} fill="#16181A" />
      <circle cx={x + 1.8} cy={y + 4.2} r={0.9} fill="#16181A" />
    </g>
  );
}

/** Drawn on a 16 x 16 grid, the same one the cards use. The kinds the board has not drawn a badge for. */
function PlaceGlyph({ kind, colour }: { kind: PlaceKind; colour: string }) {
  if (kind === "grocery") {
    return (
      <>
        <path d="M2.6 4.2 H13.4 L12.2 12.4 H3.8 Z" fill={colour} />
        <path
          d="M5.8 4.2 A2.2 2.2 0 0 1 10.2 4.2"
          fill="none"
          stroke={colour}
          strokeWidth="1.5"
        />
      </>
    );
  }
  if (kind === "parks") {
    return (
      <>
        <circle cx="8" cy="6.6" r="4.4" fill={colour} />
        <rect x="7.2" y="9.6" width="1.6" height="4.4" rx="0.8" fill={colour} />
      </>
    );
  }
  return null;
}
