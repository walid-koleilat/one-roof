import { describe, expect, it } from "vitest";
import { DECLARED, HER_WORDS } from "./criteria";

/**
 * "Built from what you told me" is a claim, so it is a test.
 *
 * A chip that says it came from her chat, and did not, is the lead form this
 * whole screen is arguing against. There is no way to check that by reading
 * the component, because the component only ever sees the label.
 */
describe("the criteria bar", () => {
  it("traces every chip to something she actually typed", () => {
    for (const c of DECLARED) {
      const found = HER_WORDS.some((w) => w.includes(c.said));
      expect(found, `no line of hers contains "${c.said}"`).toBe(true);
    }
  });

  it("does not claim a criterion twice", () => {
    expect(new Set(DECLARED.map((c) => c.id)).size).toBe(DECLARED.length);
  });
});
