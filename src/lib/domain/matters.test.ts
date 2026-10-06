import { describe, expect, it } from "vitest";
import { AGENTS } from "@/data/agents";
import { LISTINGS } from "@/data/listings";
import {
  agentMattersFor,
  agentsInOrder,
  HER_THRESHOLDS,
  mattersFor,
  railLine,
  resultMattersFor,
} from "./matters";

/**
 * The checklist is the product's claim about itself, so its rules are tests.
 *
 * Two of them matter more than the rest. A card that only ever ticks is
 * marketing, and a threshold nobody set is not hers - the second one is a
 * brief rule rather than a preference, and it is the reason nothing in here
 * invents a default.
 */
describe("what matters, on the card beside the map", () => {
  it("always leads with the claim about the space itself", () => {
    for (const listing of LISTINGS) {
      const [first] = resultMattersFor(listing);
      const [full] = mattersFor(listing);
      expect(first.label).toBe(full.label);
      // Where a photograph backs the claim it comes with it, because that is
      // the row she cannot check from the street.
      expect(first.proof).toBe(listing.proof);
    }
  });

  it("gives the second line to what the house fails, when it fails something", () => {
    const failing = LISTINGS.filter((l) => l.suite !== "legal-suite");
    expect(failing.length).toBeGreaterThan(0);
    for (const listing of failing) {
      const [, second] = resultMattersFor(listing);
      expect(second.tone).toBe("unmet");
    }
  });

  it("falls back to the drive only when there is nothing to admit", () => {
    const clean = LISTINGS.filter((l) => l.suite === "legal-suite");
    expect(clean.length).toBeGreaterThan(0);
    for (const listing of clean) {
      const [, second] = resultMattersFor(listing);
      expect(second.label).toBe("Hospital");
      expect(second.value).toBe(`${listing.driveMinutes} min`);
    }
  });

  it("shows exactly two, because a third makes the card taller than its photograph", () => {
    for (const listing of LISTINGS) {
      expect(resultMattersFor(listing)).toHaveLength(2);
    }
  });

  it("is the same list the full card shows, only shorter", () => {
    for (const listing of LISTINGS) {
      const full = mattersFor(listing).map((m) => m.label);
      for (const row of resultMattersFor(listing)) {
        expect(full).toContain(row.label);
      }
    }
  });

  it("carries her own number beside the one we measured, never a default", () => {
    const [, drive] = resultMattersFor(
      LISTINGS.find((l) => l.suite === "legal-suite")!,
      { hospitalMinutes: 9, transitMinutes: 4 },
    );
    expect(drive.against).toBe("your 9");
    expect(HER_THRESHOLDS.hospitalMinutes).not.toBe(9);
  });

  it("calls a drive over her line a miss, and under it a pass", () => {
    const listing = LISTINGS.find((l) => l.suite === "legal-suite")!;
    const under = resultMattersFor(listing, {
      hospitalMinutes: listing.driveMinutes,
      transitMinutes: 10,
    })[1];
    const over = resultMattersFor(listing, {
      hospitalMinutes: listing.driveMinutes - 1,
      transitMinutes: 10,
    })[1];
    expect(under.tone).toBe("met");
    expect(over.tone).toBe("unmet");
  });
});

describe("the rail's one line", () => {
  const clean = LISTINGS.find((l) => l.suite === "legal-suite")!;

  it("writes the comparison out, since the rail has no second column", () => {
    const [, drive] = resultMattersFor(clean, {
      hospitalMinutes: clean.driveMinutes + 1,
      transitMinutes: 10,
    });
    expect(railLine(drive)).toBe(
      `Hospital ${clean.driveMinutes} min, under your ${clean.driveMinutes + 1}`,
    );
  });

  it("says over when the drive missed her line", () => {
    const [, drive] = resultMattersFor(clean, {
      hospitalMinutes: clean.driveMinutes - 1,
      transitMinutes: 10,
    });
    expect(railLine(drive)).toBe(
      `Hospital ${clean.driveMinutes} min, over your ${clean.driveMinutes - 1}`,
    );
  });

  it("passes a shortfall through, since it is already a sentence", () => {
    const failing = LISTINGS.find((l) => l.suite !== "legal-suite")!;
    const [, shortfall] = resultMattersFor(failing);
    expect(railLine(shortfall)).toBe(shortfall.label);
  });
});

describe("what matters, on an agent", () => {
  const tamil = { language: "Tamil" };

  it("leads with her mother's question, and only when she asked", () => {
    for (const agent of AGENTS) {
      const [first] = agentMattersFor(agent, tamil);
      expect(first!.label).toBe("Your mother can ask her own questions");
      expect(agentMattersFor(agent).map((m) => m.label)).not.toContain(
        "Your mother can ask her own questions",
      );
    }
  });

  it("keeps the same three lanes on every card", () => {
    const lanes = AGENTS.map((a) =>
      agentMattersFor(a, tamil).map((m) => m.label).join("|"),
    );
    expect(new Set(lanes).size).toBe(1);
  });

  it("lets the record fail, and never on more than one line", () => {
    // Of the three shown when she asked for Tamil: Thivya has done four
    // suites; Kayal works for the seller seven times in ten. Anusha clears
    // all three, and only reads as the compromise because the other two are
    // shown honestly.
    const failures = agentsInOrder(AGENTS, tamil)
      .slice(0, 3)
      .map(
        (agent) =>
          agentMattersFor(agent, tamil).filter((m) => m.tone === "unmet").length,
      );
    expect(Math.max(...failures)).toBe(1);
    expect(failures.filter((n) => n === 1)).toHaveLength(2);
  });

  it("shows the record plainly when nothing was declared", () => {
    for (const agent of AGENTS) {
      const rows = agentMattersFor(agent);
      expect(rows).toHaveLength(2);
      expect(rows.every((m) => m.tone === "neutral")).toBe(true);
    }
  });

  it("puts the ones who speak her language first, otherwise the record", () => {
    const speaks = AGENTS.filter((a) => a.languages.includes("Tamil"));
    expect(speaks).toHaveLength(3);
    const byRequest = agentsInOrder(AGENTS, tamil).map((a) => a.id);
    expect(byRequest.slice(0, 3)).toEqual(speaks.map((a) => a.id));
    const byRecord = agentsInOrder(AGENTS).map((a) => a.suites);
    expect(byRecord).toEqual([...byRecord].sort((a, b) => b - a));
  });

  it("does not pick a language for her on the cold arrival", () => {
    // Nobody said Tamil, so the three shown are the record's top three, and
    // that is not the three who speak it. One of them still does, on merit:
    // the most suites closed of anyone here, which is the order's whole claim.
    const cold = agentsInOrder(AGENTS).slice(0, 3);
    const asked = agentsInOrder(AGENTS, tamil).slice(0, 3);
    expect(cold.map((a) => a.id)).not.toEqual(asked.map((a) => a.id));
    expect(cold.filter((a) => a.languages.includes("Tamil")).length).toBeLessThan(3);
    expect(cold[0]!.suites).toBe(Math.max(...AGENTS.map((a) => a.suites)));
  });
});
