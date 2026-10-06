import { describe, expect, it } from "vitest";
import {
  COUNTERPARTY_ORDER,
  HORIZON_COPY,
  HORIZON_ORDER,
  UNDECLARED_ASSUMPTION,
  summariseDeclaration,
} from "./declaration";
import type { Declaration } from "./types";

const declared: Declaration = {
  horizon: "under-6-months",
  counterparty: "sibling-or-executor",
  declaredAt: "2026-09-04",
};

describe("summariseDeclaration", () => {
  it("marks the undeclared state as our assumption, not the user's statement", () => {
    const s = summariseDeclaration(null);
    expect(s.assumed).toBe(true);
    expect(s.horizon).toBe(UNDECLARED_ASSUMPTION.horizon);
    expect(s.counterparty).toBe(UNDECLARED_ASSUMPTION.counterparty);
  });

  it("says out loud what it is assuming, rather than assuming silently", () => {
    expect(summariseDeclaration(null).sentence).toContain(
      "six to eighteen months",
    );
  });

  it("attributes a declaration to the user and dates it", () => {
    const s = summariseDeclaration(declared);
    expect(s.assumed).toBe(false);
    expect(s.sentence).toContain("You said under six months");
    expect(s.sentence).toContain("September 4, 2026");
  });

  it("carries the consequence of the horizon in both states", () => {
    expect(summariseDeclaration(declared).consequence).toBe(
      HORIZON_COPY["under-6-months"].consequence,
    );
    expect(summariseDeclaration(null).consequence).toBe(
      HORIZON_COPY[UNDECLARED_ASSUMPTION.horizon].consequence,
    );
  });

  it("returns the same shape either way, so a UI cannot render one as the other", () => {
    expect(Object.keys(summariseDeclaration(null)).sort()).toEqual(
      Object.keys(summariseDeclaration(declared)).sort(),
    );
  });
});

describe("copy tables", () => {
  it("covers every horizon and orders them fastest clock first", () => {
    expect(HORIZON_ORDER).toHaveLength(Object.keys(HORIZON_COPY).length);
    expect(HORIZON_ORDER[0]).toBe("now");
    expect(HORIZON_ORDER.at(-1)).toBe("can-hold");
  });

  it("gives every horizon a consequence, since a choice without one is a form field", () => {
    for (const horizon of HORIZON_ORDER) {
      expect(HORIZON_COPY[horizon].consequence.length).toBeGreaterThan(0);
    }
  });

  it("ends the counterparty list with the one that convinces nobody", () => {
    expect(COUNTERPARTY_ORDER.at(-1)).toBe("none-stated");
  });
});
