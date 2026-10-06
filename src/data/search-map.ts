import type { MapPlace, PinShape } from "@/components/price-map";
import type { Listing } from "@/data/listings";
import { formatCurrencyCompact } from "@/lib/domain/format";

/**
 * Where each home sits on the search map, and what she asked to see near it.
 *
 * Keyed by listing id rather than written as its own list, so a home cannot
 * exist on the map without existing in `listings.ts`. That is the rule that
 * broke last time: the search page had pins for addresses no other screen had
 * heard of.
 *
 * The coordinates are drawing, not geography. They are arranged so most of
 * the homes sit inside the boundary she drew and a few fall outside it,
 * because the map's job here is to show the shape of the search, not to
 * navigate Scarborough.
 */

/**
 * The drawing everything on this map is placed on.
 *
 * Exported rather than typed into the page, so the bounds test and the
 * component cannot end up holding two different ideas of how big it is. That
 * is the mistake the advert's map already made once.
 */
export const SEARCH_MAP_VIEWBOX = { width: 1328, height: 540 } as const;

/**
 * The taller canvas the search page actually shows.
 *
 * The map art was drawn 2.4 times wider than tall, and the column beside the
 * list is taller than it is wide, so a frame that filled it could only crop
 * the drawing: at a window's height the pins came out half again their size
 * and the area she drew ran off both edges. `map-bendale-tall.jpg` continues
 * the roads and the river above and below the original band, and this is
 * the viewBox over it. The band keeps its coordinates: y runs negative above
 * it, so nothing placed on the drawing had to move.
 */
const TALL_IMAGE = { width: 1536, height: 1280, bandTop: 320 } as const;
const UNIT = SEARCH_MAP_VIEWBOX.width / TALL_IMAGE.width;
export const SEARCH_MAP_CANVAS = {
  x: 0,
  y: -TALL_IMAGE.bandTop * UNIT,
  width: SEARCH_MAP_VIEWBOX.width,
  height: TALL_IMAGE.height * UNIT,
} as const;

/** The area she drew. */
export const SEARCH_BOUNDARY =
  "M196 92 L470 58 L742 74 L946 138 L992 300 L820 420 L520 452 L268 396 L166 236 Z";

export const PIN_AT: Record<string, { x: number; y: number }> = {
  "ellendale-64": { x: 300, y: 176 },
  "pitfield-32": { x: 232, y: 300 },
  "painted-post-201": { x: 470, y: 128 },
  "ellesmere-40": { x: 606, y: 216 },
  "morningside-145": { x: 780, y: 292 },
  "bellamy-18": { x: 660, y: 356 },
  "fenwood-9": { x: 386, y: 386 },
  "coatsbrae-28": { x: 852, y: 168 },
  "brimley-7": { x: 452, y: 244 },
  "kecala-12": { x: 356, y: 118 },
  "marcos-61": { x: 716, y: 176 },
  "galloway-7": { x: 1052, y: 246 },
};

export const SEARCH_LABELS = [
  { x: 470, y: 250, text: "BENDALE", primary: true },
  { x: 1030, y: 120, text: "WOBURN" },
  { x: 236, y: 470, text: "CEDARBRAE" },
  { x: 1120, y: 420, text: "GUILDWOOD" },
  { x: 230, y: 70, text: "DORSET PARK" },
] as const;

/**
 * The three kinds of place she named, and nothing else.
 *
 * Her mother does not drive and had a fall in March, so a hospital, a bus and
 * somewhere to worship are search criteria rather than points of interest. A
 * map that also showed schools and restaurants would be answering a question
 * nobody asked and burying the three that were.
 *
 * Two hospitals, because the drive time on every card is to Birchmount and a
 * map that only showed the other one would be measuring against something it
 * does not draw. Birchmount reads in ink for the same reason. Four bus stops
 * with no names, since "the bus runs here" is the whole fact. Two temples,
 * named, because the front door promised the map puts the temple next to
 * each home and a badge that said only "worship" would not keep that promise.
 */
export const SEARCH_PLACES: readonly MapPlace[] = [
  { x: 980, y: 70, kind: "health", label: "Birchmount", named: true },
  { x: 560, y: 476, kind: "health", label: "Scarborough General" },
  { x: 330, y: 252, kind: "transit" },
  { x: 624, y: 306, kind: "transit" },
  { x: 900, y: 226, kind: "transit" },
  { x: 560, y: 420, kind: "transit" },
  { x: 520, y: 190, kind: "worship", label: "Murugan temple" },
  { x: 844, y: 416, kind: "worship", label: "Sri Varasiddhi Vinayagar" },
];

/**
 * Which of the three routes a home is on, for the label its pin carries.
 *
 * A home with a second kitchen and no record at the city is on none of them.
 * If it ever has a card, its pin takes the could-convert label as the least
 * wrong of three: whatever is down there, the city has not checked it.
 */
const SHAPE_OF: Record<Listing["suite"], PinShape> = {
  "legal-suite": "suite",
  "ground-floor": "ground",
  "could-convert": "convert",
  "no-permit": "convert",
};

/**
 * Which of the pinned homes fall inside the area she drew.
 *
 * The key under the map used to print the sample size against the market
 * total, which is not what "inside it" means. This is a point-in-polygon
 * over the boundary path, so the number measures what the label says.
 */
export function insideBoundary(ids: readonly string[]): number {
  const poly = SEARCH_BOUNDARY.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const pts: [number, number][] = [];
  for (let i = 0; i < poly.length; i += 2) pts.push([poly[i]!, poly[i + 1]!]);
  const inside = (x: number, y: number) => {
    let hit = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i]!;
      const [xj, yj] = pts[j]!;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  };
  return ids.filter((id) => {
    const at = PIN_AT[id];
    return at ? inside(at.x, at.y) : false;
  }).length;
}

/**
 * A pin for each home with a card, and for nothing else.
 *
 * The map used to draw the rest of the listings too, in a lighter grey, as
 * "nearby". That was a fourth look on a map that has three, and it was a pin
 * for a home she could not open from here: a control that does nothing,
 * which is worse than no control. So a home is on the map because it is on
 * the page, and every pin lights a card.
 */
export function pinsFor(
  listings: readonly Listing[],
  shown: readonly Listing[],
) {
  const showing = new Set(shown.map((l) => l.id));
  return listings
    .filter((l) => showing.has(l.id) && PIN_AT[l.id])
    .map((l) => ({
      id: l.id,
      ...PIN_AT[l.id]!,
      shape: SHAPE_OF[l.suite],
      // $1,189,000 becomes $1.19M, which is what fits inside a pin.
      price: formatCurrencyCompact(l.askingPrice.value),
      state: "listed" as const,
    }));
}
