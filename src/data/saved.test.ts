import { describe, expect, it } from "vitest";
import { SAVED } from "./counts";
import {
  CAST,
  hasEnglish,
  SAVED_COLLECTIONS,
  SAVED_HOMES,
  WHEN_ORDER,
  type Message,
} from "./saved";

/**
 * The saved fixture's own rules, as tests.
 *
 * Most of what this file promises is about voice - who speaks, in what
 * language, on which day - and voice is exactly the kind of thing that drifts
 * when six new records are written on a Tuesday. These are the parts of the
 * promise a test can hold.
 */

const everyMessage = (): readonly Message[] => [
  ...SAVED_HOMES.flatMap((h) => h.thread),
  ...SAVED_COLLECTIONS.flatMap((c) => c.thread),
];

describe("every id is stamped and unique", () => {
  it("gives every entry across every home its own id", () => {
    const ids = SAVED_HOMES.flatMap((h) => [
      ...h.history.map((e) => e.id),
      ...h.notes.map((n) => n.id),
      ...h.thread.map((m) => m.id),
      ...(h.conditions ?? []).map((c) => c.id),
    ]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.length > 0)).toBe(true);
  });

  it("names no home twice", () => {
    const ids = SAVED_HOMES.map((h) => h.listingId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("every date is a phrase she would say, and the phrases are placed", () => {
  it("uses only phrases WHEN_ORDER knows", () => {
    const whens = [
      ...SAVED_HOMES.map((h) => h.savedOn),
      ...SAVED_HOMES.flatMap((h) => h.history.map((e) => e.when)),
      ...SAVED_HOMES.flatMap((h) => h.thread.map((m) => m.when)),
      ...SAVED_HOMES.flatMap((h) => (h.conditions ?? []).map((c) => c.by)),
      ...SAVED_COLLECTIONS.map((c) => c.madeOn),
      ...SAVED_COLLECTIONS.flatMap((c) => c.thread.map((m) => m.when)),
    ];
    for (const when of whens) {
      expect(WHEN_ORDER[when], `"${when}" is not placed in WHEN_ORDER`).toBeDefined();
    }
  });

  it("tells each home's history newest first", () => {
    for (const home of SAVED_HOMES) {
      for (let i = 1; i < home.history.length; i++) {
        const newer = home.history[i - 1]!;
        const older = home.history[i]!;
        expect(
          WHEN_ORDER[newer.when]!,
          `${home.listingId}: "${newer.what}" (${newer.when}) should be no older than "${older.what}" (${older.when})`,
        ).toBeGreaterThanOrEqual(WHEN_ORDER[older.when]!);
      }
    }
  });

  it("gives at most one event the dot", () => {
    for (const home of SAVED_HOMES) {
      const notable = home.history.filter((e) => e.weight === "notable");
      expect(notable.length, home.listingId).toBeLessThanOrEqual(1);
    }
  });
});

describe("who speaks, and how", () => {
  it("has everyone in a thread in the cast", () => {
    for (const m of everyMessage()) {
      expect(CAST[m.from], `${m.from} is not in the cast`).toBeDefined();
    }
  });

  it("has Amma and Appa speak only by voice, in Tamil", () => {
    // Amma has no English. A typed message from her would be the product
    // putting words in her mouth.
    for (const m of everyMessage()) {
      if (hasEnglish(CAST[m.from])) continue;
      expect(m.voice, `${m.id} from ${m.from} has no voice note`).toBeDefined();
      expect(m.voice?.spoken?.lang, `${m.id} has no Tamil`).toBe("ta");
      expect(m.voice?.spoken?.text.length, `${m.id} has empty Tamil`).toBeGreaterThan(0);
      expect(m.text.length, `${m.id} has no English under it`).toBeGreaterThan(0);
    }
  });

  it("keeps a condition's owner in the cast", () => {
    for (const home of SAVED_HOMES) {
      for (const c of home.conditions ?? []) {
        expect(CAST[c.who]).toBeDefined();
      }
    }
  });
});

describe("the stage is a tag, and it means what it says", () => {
  it("carries conditions only at closing", () => {
    for (const home of SAVED_HOMES) {
      if (home.stage === "closing") {
        expect(home.conditions?.length, `${home.listingId} is closing with no conditions`).toBeGreaterThan(0);
      } else {
        expect(home.conditions, `${home.listingId} has conditions but is not closing`).toBeUndefined();
      }
    }
  });

  it("is gone if and only if it sold", () => {
    for (const home of SAVED_HOMES) {
      expect(home.stage === "gone", home.listingId).toBe(Boolean(home.sold));
    }
  });

  it("never writes a note that has already happened onto a home she has not seen", () => {
    // Prose after a visit belongs to a home she has stood in.
    for (const home of SAVED_HOMES) {
      if (!home.afterVisit) continue;
      expect(
        ["visited", "offer-in", "closing"].includes(home.stage ?? ""),
        `${home.listingId} has an after-visit note at stage ${home.stage}`,
      ).toBe(true);
    }
  });
});

describe("the two lanes, and what may not cross between them", () => {
  it("puts the agent on some homes and not on others", () => {
    const on = SAVED_HOMES.filter((h) => h.agent).length;
    expect(on).toBe(SAVED.agentOn);
    expect(on).toBeLessThan(SAVED_HOMES.length);
    expect(on).toBeGreaterThan(0);
  });

  it("gives a lane and papers only to a home she is on", () => {
    // Words sitting in a lane nobody can read is a fixture that has drifted.
    for (const home of SAVED_HOMES) {
      if (home.agent) continue;
      expect(home.withAgent, `${home.listingId} has an agent lane`).toEqual([]);
      expect(home.papers, `${home.listingId} has papers`).toEqual([]);
    }
  });

  it("never lets the agent speak in the family's lane", () => {
    for (const home of SAVED_HOMES) {
      for (const m of home.thread) {
        expect(CAST[m.from].tone, `${m.id}`).not.toBe("agent");
      }
    }
    for (const c of SAVED_COLLECTIONS) {
      for (const m of c.thread) {
        expect(CAST[m.from].tone, `${m.id}`).not.toBe("agent");
      }
    }
  });

  it("never lets the family speak in the agent's lane unless they sent it", () => {
    for (const home of SAVED_HOMES) {
      for (const m of home.withAgent) {
        if (CAST[m.from].tone === "agent") continue;
        expect(m.forwarded, `${m.id} is in the agent lane and was never sent`).toBe(
          true,
        );
      }
    }
  });

  it("marks every message that names the line, and keeps them all family-side", () => {
    // Arun is the reason the lanes exist. Every message of his does the
    // arithmetic, and none of it may travel.
    const budget = [
      ...SAVED_HOMES.flatMap((h) => h.thread),
      ...SAVED_COLLECTIONS.flatMap((c) => c.thread),
    ].filter((m) => m.about === "budget");
    expect(budget.length).toBeGreaterThan(2);
    for (const m of budget) {
      expect(m.forwarded, `${m.id} names the line and was sent`).toBeUndefined();
    }
    for (const home of SAVED_HOMES) {
      for (const m of home.withAgent) {
        expect(m.about, `${m.id}`).not.toBe("budget");
      }
    }
  });

  it("never puts the agent on a box", () => {
    for (const c of SAVED_COLLECTIONS) {
      for (const p of c.sharedWith) {
        expect(CAST[p].tone, `${c.id} shares with ${p}`).not.toBe("agent");
      }
    }
  });

  it("names a filer who is in the cast, and a date the week can place", () => {
    for (const home of SAVED_HOMES) {
      for (const paper of home.papers) {
        if (paper.state === "on-file") {
          expect(CAST[paper.from], paper.id).toBeDefined();
          expect(WHEN_ORDER[paper.when], `${paper.id}: "${paper.when}"`).toBeDefined();
        } else {
          expect(WHEN_ORDER[paper.due], `${paper.id}: "${paper.due}"`).toBeDefined();
        }
      }
    }
  });

  it("keeps a gist short enough for a tile", () => {
    const gists = SAVED_HOMES.flatMap((h) =>
      [...h.thread, ...h.withAgent].flatMap((m) => (m.gist ? [m.gist] : [])),
    );
    expect(gists.length).toBeGreaterThan(0);
    for (const gist of gists) {
      expect(gist.split(/\s+/).length, `"${gist}"`).toBeLessThanOrEqual(5);
    }
  });
});

describe("closing, and the clock on it", () => {
  it("gives a closing home a date for the keys, and no condition for them", () => {
    // The keys are not a condition. Nothing has to hold for them; they are
    // the day the thing ends, and they belong in the heading.
    for (const home of SAVED_HOMES) {
      if (home.stage !== "closing") continue;
      expect(home.closes, home.listingId).toBeDefined();
      expect(WHEN_ORDER[home.closes!], home.closes).toBeDefined();
      for (const c of home.conditions ?? []) {
        expect(c.what.toLowerCase(), home.listingId).not.toContain("keys");
      }
    }
  });

  it("names a holder for every condition, and places its day", () => {
    for (const home of SAVED_HOMES) {
      for (const c of home.conditions ?? []) {
        expect(CAST[c.who], c.id).toBeDefined();
        expect(WHEN_ORDER[c.by], `${c.id}: "${c.by}"`).toBeDefined();
      }
    }
  });
});

describe("tone, the parts a test can hold", () => {
  it("never shouts", () => {
    const strings = [
      ...SAVED_HOMES.flatMap((h) => [
        ...h.history.map((e) => e.what),
        ...h.notes.map((n) => n.what),
        ...h.thread.map((m) => m.text),
        h.afterVisit ?? "",
        h.notesTitle ?? "",
      ]),
      ...SAVED_COLLECTIONS.flatMap((c) => [c.because ?? "", ...c.thread.map((m) => m.text)]),
    ];
    for (const s of strings) {
      expect(s, `"${s}" has an exclamation mark`).not.toMatch(/!/);
    }
  });

  it("keeps a history line short enough to scan", () => {
    for (const home of SAVED_HOMES) {
      for (const e of home.history) {
        expect(e.what.split(/\s+/).length, `"${e.what}"`).toBeLessThanOrEqual(9);
      }
    }
  });
});
