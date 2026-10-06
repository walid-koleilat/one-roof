import { describe, expect, it } from "vitest";
import { CLOSING_REPLY, WIDGET_ANSWER } from "./conversation";
import {
  AREA_SHAPES,
  EXCLUDED,
  LISTINGS,
  WIDGET_LISTINGS,
  type Listing,
} from "./listings";

/**
 * The assistant's closing paragraph makes four checkable claims about a house
 * it does not draw a card for: its address, that it has a kitchen with no
 * record, that it is the cheapest of the four, and how far it is from the
 * hospital. Prose is the easiest place for a number to drift, because nothing
 * renders it twice. These assertions are the only thing holding it.
 */

const suites = LISTINGS.filter(
  (l) => l.metrics.kitchens > 1 && l.neighbourhood !== "West Hill",
);

const excluded: Listing | undefined = LISTINGS.find(
  (l) => l.address === EXCLUDED.address,
);

/** The four the widget counts: a second kitchen with its own door. */
const fourWithASuite = [...WIDGET_LISTINGS, excluded!];

describe("the closing paragraph", () => {
  it("names a house that exists", () => {
    expect(excluded).toBeDefined();
  });

  it("names the one with no record at the city", () => {
    expect(excluded!.suite).toBe("no-permit");
    expect(excluded!.permit).toBe("No permit on record");
  });

  it("only withholds a house that does have the second kitchen", () => {
    expect(excluded!.metrics.kitchens).toBeGreaterThan(1);
  });

  it("is right that it is the cheapest of the four", () => {
    const cheapest = fourWithASuite.toSorted(
      (a, b) => a.askingPrice.value - b.askingPrice.value,
    )[0];
    expect(cheapest!.address).toBe(EXCLUDED.address);
    expect(CLOSING_REPLY[1]).toContain("cheapest of the four");
  });

  it("quotes the drive time the listing actually carries", () => {
    const spelled = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
    expect(CLOSING_REPLY[1]).toContain(
      `${spelled[excluded!.driveMinutes]} minutes to the hospital`,
    );
  });

  it("does not name a house the widget already drew a card for", () => {
    const drawn = WIDGET_LISTINGS.map((l) => l.address);
    expect(drawn).not.toContain(EXCLUDED.address);
  });
});

describe("the widget's answer", () => {
  it("claims as many second kitchens as the map key draws", () => {
    const suiteShape = AREA_SHAPES.find((s) => s.shape === "suite")!;
    expect(fourWithASuite).toHaveLength(suiteShape.count);
    expect(WIDGET_ANSWER[0]).toContain("Four of the eleven");
  });

  it("shows every one of those four that has a record, and no others", () => {
    const withRecord = fourWithASuite.filter((l) => l.suite === "legal-suite");
    expect(withRecord).toHaveLength(WIDGET_LISTINGS.length);
    expect(WIDGET_ANSWER[0]).toContain("Three of those four");
  });

  it("keeps the four apart on price, so no two are the same house", () => {
    const prices = fourWithASuite.map((l) => l.askingPrice.value);
    expect(new Set(prices).size).toBe(prices.length);
  });
});

/** `suites` is only here to keep the filter honest if someone edits the data. */
describe("the data behind the four", () => {
  it("has at least the four the copy counts", () => {
    expect(suites.length).toBeGreaterThanOrEqual(fourWithASuite.length);
  });
});
