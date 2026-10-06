import { describe, expect, it } from "vitest";
import {
  PIN_HEIGHT,
  pinWidth,
  placeBox,
  type MapPlace,
} from "@/components/price-map";
import { LISTINGS } from "./listings";
import {
  insideBoundary,
  PIN_AT,
  pinsFor,
  SEARCH_MAP_VIEWBOX,
  SEARCH_PLACES,
} from "./search-map";

/**
 * The search map says a word rather than a price, and the word is a claim.
 *
 * A pin reading "Suite" beside a card reading "no record at the city" is worse
 * than a pin reading nothing, so the route on the map is derived from the
 * listing and this file is what stops it drifting back to a hand-written copy.
 * The width assertion is here for the same reason the advert's is: the pill
 * fits its word, and "+ Could convert" is nearly twice the box "Suite" needs.
 */
describe("the search map", () => {
  it("has no pin for a home that does not exist", () => {
    const ids = new Set(LISTINGS.map((l) => l.id));
    for (const id of Object.keys(PIN_AT)) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it("says the same thing about a home as its card does", () => {
    const expected: Record<string, string> = {
      "legal-suite": "suite",
      "ground-floor": "ground",
      "could-convert": "convert",
      "no-permit": "convert",
    };
    const pins = pinsFor(LISTINGS, LISTINGS);
    for (const listing of LISTINGS.filter((l) => PIN_AT[l.id])) {
      const pin = pins.find((p) => p.id === listing.id)!;
      expect(pin.shape).toBe(expected[listing.suite]);
    }
  });

  it("draws a pin only for a home with a card on screen", () => {
    const shown = LISTINGS.slice(0, 3);
    const pins = pinsFor(LISTINGS, shown);
    // Every pin has a card, so every pin is pressable. There is no grey
    // "nearby" pin for the rest of the market.
    expect(pins.every((p) => p.id && p.state === "listed")).toBe(true);
    expect(pins.map((p) => p.id).toSorted()).toEqual(
      shown.filter((l) => PIN_AT[l.id]).map((l) => l.id).toSorted(),
    );
  });

  it("keeps every pill inside the drawing, price and all", () => {
    // Derived the way the component derives it, so a longer label fails here
    // rather than hanging off the edge of the map in front of a reader.
    const widest = Math.max(
      ...pinsFor(LISTINGS, LISTINGS).map((p) => pinWidth(p.price)),
    );
    for (const pin of pinsFor(LISTINGS, LISTINGS)) {
      expect(pin.x).toBeGreaterThanOrEqual(0);
      expect(pin.x + widest).toBeLessThanOrEqual(SEARCH_MAP_VIEWBOX.width);
      expect(pin.y).toBeGreaterThanOrEqual(0);
      expect(pin.y + PIN_HEIGHT).toBeLessThanOrEqual(SEARCH_MAP_VIEWBOX.height);
    }
  });
});

/**
 * The places are drawn under the pins, so a badge that lands on a pill is a
 * badge she cannot see and a name she cannot read. The boxes come from the
 * same estimates the drawing uses.
 */
describe("the places she named", () => {
  const box = (p: MapPlace) => placeBox(p);
  const pins = pinsFor(LISTINGS, LISTINGS).map((p) => ({
    id: p.id,
    x: p.x,
    y: p.y,
    width: pinWidth(p.price),
    height: PIN_HEIGHT,
  }));
  const overlaps = (
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number },
  ) =>
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height;

  it("stay inside the drawing, label and all", () => {
    for (const place of SEARCH_PLACES) {
      const b = box(place);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(SEARCH_MAP_VIEWBOX.width);
      expect(b.y + b.height).toBeLessThanOrEqual(SEARCH_MAP_VIEWBOX.height);
    }
  });

  it("never sit under a pin", () => {
    for (const place of SEARCH_PLACES) {
      const b = box(place);
      const hit = pins.find((pin) => overlaps(b, pin));
      expect(hit, `${place.kind} at ${place.x},${place.y} under ${hit?.id}`).toBeUndefined();
    }
  });

  it("never sit on each other", () => {
    for (const [i, a] of SEARCH_PLACES.entries()) {
      for (const b of SEARCH_PLACES.slice(i + 1)) {
        expect(overlaps(box(a), box(b))).toBe(false);
      }
    }
  });

  it("draw the hospital the cards measure against in ink, and only that one", () => {
    const lead = SEARCH_PLACES.filter((p) => p.named);
    expect(lead.map((p) => p.label)).toEqual(["Birchmount"]);
  });

  it("name every temple and no bus stop", () => {
    for (const place of SEARCH_PLACES) {
      if (place.kind === "worship") expect(place.label).toBeTruthy();
      if (place.kind === "transit") expect(place.label).toBeUndefined();
    }
  });
});

describe("the area she drew", () => {
  it("counts only the pins inside it, and never a home with no pin", () => {
    const all = Object.keys(PIN_AT);
    const inside = insideBoundary(all);
    expect(inside).toBeGreaterThan(0);
    expect(inside).toBeLessThan(all.length);
    expect(insideBoundary(["nowhere-1"])).toBe(0);
    // Galloway is drawn outside the boundary on purpose.
    expect(insideBoundary(["galloway-7"])).toBe(0);
  });
});
