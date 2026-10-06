import { describe, expect, it } from "vitest";
import { SHAPE_LABEL } from "@/components/price-map";
import { AD_MAP_VIEWBOX, AD_PINS } from "./ad-map";
import { AD_LISTINGS, AREA_SHAPES, AREA_TOTAL } from "./listings";

/**
 * The advert makes a countable claim, so the count is a test.
 *
 * "Eleven in Scarborough, in three different shapes" is checkable by anyone
 * looking at the map, and for a while it was wrong: the headline said eleven
 * and the map drew five. These assertions exist so the copy and the drawing
 * cannot part company again without something going red.
 */
describe("the advert's map", () => {
  it("draws as many homes as the sub-line claims", () => {
    expect(AD_PINS).toHaveLength(AREA_TOTAL);
  });

  it("draws each shape as often as the key says it does", () => {
    for (const shape of AREA_SHAPES) {
      const drawn = AD_PINS.filter((p) => p.shape === shape.shape);
      expect(drawn).toHaveLength(shape.count);
    }
  });

  it("gives a card to every pin that has one, and only those", () => {
    const withCards = AD_PINS.filter((p) => p.id).map((p) => p.id);
    expect(withCards.toSorted()).toEqual(
      AD_LISTINGS.map((l) => l.id).toSorted(),
    );
  });

  it("shows one of each shape in the three cards, since she asked for options", () => {
    const shapes = AD_PINS.filter((p) => p.id).map((p) => p.shape);
    expect(new Set(shapes).size).toBe(AREA_SHAPES.length);
  });

  it("keeps every pin inside the drawing, not hanging off an edge", () => {
    // The pill fits its word now, so the width is derived the way the
    // component derives it rather than being a number copied into the test
    // and left behind the next time a label changes.
    const widest = Math.max(
      ...AD_PINS.map((p) => Math.round(SHAPE_LABEL[p.shape].length * 6.7) + 40),
    );
    for (const pin of AD_PINS) {
      expect(pin.x).toBeGreaterThanOrEqual(0);
      expect(pin.x + widest).toBeLessThanOrEqual(AD_MAP_VIEWBOX.width);
      expect(pin.y).toBeGreaterThanOrEqual(0);
      expect(pin.y + 34).toBeLessThanOrEqual(AD_MAP_VIEWBOX.height);
    }
  });
});
