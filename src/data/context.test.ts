import { describe, expect, it } from "vitest";
import { CLAUSES, saidByHer, searchPart, SENTENCES } from "./context";
import { countFor, DEFAULT_SEARCH } from "./counts";

/**
 * "From your chat" is a claim, and a claim needs something behind it.
 *
 * Every underlined clause in the panel carries the phrase she typed that put
 * it there, and every option is a real change to the search the counts are
 * computed from. If either stops being true the panel is a lead form wearing
 * a label, which is the thing the brief forbids.
 */
describe("the context panel", () => {
  it("underlines only things she actually said", () => {
    expect(CLAUSES.length).toBeGreaterThanOrEqual(5);
    for (const clause of CLAUSES) {
      expect(saidByHer(clause), `"${clause.said}"`).toBe(true);
    }
  });

  it("has five sentences, each with at least one thing to change", () => {
    expect(SENTENCES).toHaveLength(5);
    for (const sentence of SENTENCES) {
      expect(sentence.some((p) => typeof p !== "string")).toBe(true);
    }
  });

  it("always knows which option the current search is", () => {
    for (const clause of CLAUSES) {
      const at = clause.current(DEFAULT_SEARCH, true);
      expect(at).toBeGreaterThanOrEqual(0);
      expect(at).toBeLessThan(clause.options.length);
    }
  });

  it("moves the count before she chooses, for every option that can", () => {
    const base = countFor(DEFAULT_SEARCH);
    for (const clause of CLAUSES) {
      const counts = clause.options.map(({ patch }) =>
        countFor({ ...DEFAULT_SEARCH, ...searchPart(patch) }),
      );
      // The current option reproduces the number on the bar.
      expect(counts[clause.current(DEFAULT_SEARCH, true)]).toBe(base);
      // Every count is a real number of homes, never a guess.
      for (const c of counts) expect(Number.isInteger(c) && c >= 0).toBe(true);
    }
  });
});
