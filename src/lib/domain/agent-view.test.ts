import { describe, expect, it } from "vitest";
import { CEILING_INPUTS } from "@/data/budget";
import {
  CAST,
  SAVED_COLLECTIONS,
  SAVED_HOMES,
  SAVED_SEARCHES,
  type Message,
  type SavedHome,
} from "@/data/saved";
import {
  agentOnFor,
  agentViewOf,
  homesWithAgent,
  isSendable,
  wasSent,
  whyNotSendable,
} from "./agent-view";
import { ceilingFrom, verdictLabel, type Verdict } from "./budget";
import { formatCurrency } from "./format";
import { savedReducer } from "./saved-reducer";
import { initSession, type SavedSession } from "./saved-session";

/**
 * What leaves the household, as tests.
 *
 * The page prints one sentence in three places - Anusha sees the homes you
 * put her on, the papers, and what you send her; not your budget, not your
 * home, not what the family says - and this file is what makes that sentence
 * true rather than decorative. The fixture already broke the earlier version
 * of the promise: Arun names the ceiling in three threads on homes the agent
 * is on, and before the lanes existed those threads were the only thread.
 */

const fresh = (): SavedSession =>
  initSession({
    collections: SAVED_COLLECTIONS,
    firstSearchId: SAVED_SEARCHES[0]!.id,
  });

const homeById = (id: string): SavedHome => {
  const home = SAVED_HOMES.find((h) => h.listingId === id);
  if (!home) throw new Error(`no fixture home "${id}"`);
  return home;
};

/** Every word the agent would read, across every home she is on. */
function everythingSheSees(session: SavedSession): readonly string[] {
  return homesWithAgent(SAVED_HOMES, session).flatMap((home) => {
    const view = agentViewOf(home, session);
    return [
      ...view.messages.map((m) => m.text),
      ...view.messages.flatMap((m) => (m.voice?.spoken ? [m.voice.spoken.text] : [])),
      ...view.papers.map((p) => p.what),
      ...view.conditions.flatMap((c) => [c.what, c.by, c.holder ?? ""]),
    ];
  });
}

describe("the seat", () => {
  it("is off on a home the fixture did not put her on", () => {
    expect(agentOnFor(homeById("bellamy-18"), fresh())).toBe(false);
    expect(agentOnFor(homeById("marcos-61"), fresh())).toBe(false);
  });

  it("is on where the fixture says so", () => {
    expect(agentOnFor(homeById("ellendale-64"), fresh())).toBe(true);
  });

  it("is never on every home she saved", () => {
    // An agent on everything is an agent on the whole search, which is the
    // model this page is arguing against.
    const on = homesWithAgent(SAVED_HOMES, fresh()).length;
    expect(on).toBeGreaterThan(0);
    expect(on).toBeLessThan(SAVED_HOMES.length);
  });

  it("takes her off a home the fixture had her on, and puts her back", () => {
    const off = savedReducer(fresh(), {
      type: "setAgent",
      listingId: "ellendale-64",
      on: false,
    });
    expect(agentOnFor(homeById("ellendale-64"), off)).toBe(false);
    const back = savedReducer(off, {
      type: "setAgent",
      listingId: "ellendale-64",
      on: true,
    });
    expect(agentOnFor(homeById("ellendale-64"), back)).toBe(true);
  });

  it("moves one home and no other", () => {
    const session = savedReducer(fresh(), {
      type: "setAgent",
      listingId: "bellamy-18",
      on: true,
    });
    expect(agentOnFor(homeById("bellamy-18"), session)).toBe(true);
    expect(agentOnFor(homeById("marcos-61"), session)).toBe(false);
  });
});

describe("a home she is not on", () => {
  it("shows her nothing at all, rather than trusting the caller to check", () => {
    const view = agentViewOf(homeById("bellamy-18"), fresh());
    expect(view.messages).toEqual([]);
    expect(view.papers).toEqual([]);
    expect(view.conditions).toEqual([]);
  });

  it("goes quiet the moment the seat comes off, papers and all", () => {
    const off = savedReducer(fresh(), {
      type: "setAgent",
      listingId: "ellendale-64",
      on: false,
    });
    const view = agentViewOf(homeById("ellendale-64"), off);
    expect(view.messages).toEqual([]);
    expect(view.papers).toEqual([]);
  });
});

describe("what the agent can see", () => {
  it("holds no message from the family that was not sent to her", () => {
    for (const home of homesWithAgent(SAVED_HOMES, fresh())) {
      for (const m of agentViewOf(home, fresh()).messages) {
        const mine = CAST[m.from].tone !== "agent";
        expect(
          !mine || m.forwarded === true,
          `${home.listingId}: "${m.text}" is in the agent lane from ${m.from} and was never sent`,
        ).toBe(true);
      }
    }
  });

  it("holds no message about the budget, sent or otherwise", () => {
    for (const home of homesWithAgent(SAVED_HOMES, fresh())) {
      for (const m of agentViewOf(home, fresh()).messages) {
        expect(m.about, `${home.listingId}: "${m.text}"`).not.toBe("budget");
      }
    }
  });

  it("never carries either end of the ceiling", () => {
    const ceiling = ceilingFrom(CEILING_INPUTS);
    const ends = [
      formatCurrency(ceiling.low.value),
      formatCurrency(ceiling.high.value),
    ];
    for (const said of everythingSheSees(fresh())) {
      for (const end of ends) {
        expect(said, `"${said}" carries the ceiling`).not.toContain(end);
      }
    }
  });

  it("has nowhere to put a verdict, and puts none anywhere", () => {
    // The strongest version of this is structural: the object handed to an
    // agent-facing surface has four keys and none of them is a verdict, so a
    // component cannot render one by accident. The substring check that used
    // to stand here failed on "it still went over", which is the market
    // talking about a house rather than the product talking about her money.
    const view = agentViewOf(homeById("ellendale-64"), fresh());
    expect(Object.keys(view).sort()).toEqual([
      "conditions",
      "listingId",
      "messages",
      "papers",
    ]);

    const verdicts: readonly Verdict[] = ["inside", "depends", "over"];
    const labels = verdicts.map(verdictLabel);
    for (const said of everythingSheSees(fresh())) {
      for (const label of labels) {
        expect(said.trim(), `"${said}" is a verdict`).not.toBe(label);
      }
    }
  });

  it("never carries a price criterion off one of her searches", () => {
    // "Under $1,250,000" is the search saying what she can spend. It is the
    // ceiling by another name and it does not travel.
    const priced = SAVED_SEARCHES.flatMap((s) =>
      s.criteria.filter((c) => c.includes("$")),
    );
    expect(priced.length).toBeGreaterThan(0);
    for (const said of everythingSheSees(fresh())) {
      for (const criterion of priced) {
        expect(said).not.toContain(criterion);
      }
    }
  });

  it("carries the papers on a home she is on, with who filed them", () => {
    const view = agentViewOf(homeById("ellendale-64"), fresh());
    expect(view.papers.length).toBeGreaterThan(0);
    const owed = view.papers.filter((p) => p.state === "owed");
    expect(owed.length, "the inspection report is still owed").toBeGreaterThan(0);
  });

  it("carries the conditions, so the one she holds has a date on it", () => {
    const view = agentViewOf(homeById("ellendale-64"), fresh());
    const hers = view.conditions.filter((c) => c.who === "anusha");
    expect(hers.length).toBe(1);
    expect(hers[0]!.by.length).toBeGreaterThan(0);
  });
});

describe("sending one message across", () => {
  const ellendale = homeById("ellendale-64");
  const said = (text: string): Message => {
    const m = ellendale.thread.find((x) => x.text.startsWith(text));
    if (!m) throw new Error(`no message starting "${text}"`);
    return m;
  };

  it("refuses the one with her line in it, and says why", () => {
    const arun = said("If it goes to");
    expect(arun.about).toBe("budget");
    expect(isSendable(arun, ellendale, fresh())).toBe(false);
    expect(whyNotSendable(arun)).toBe("Not sendable. It has your line in it.");
  });

  it("allows Amma's note, which is about the house", () => {
    const amma = said("The kitchen downstairs");
    expect(isSendable(amma, ellendale, fresh())).toBe(true);
    expect(whyNotSendable(amma)).toBe("");
  });

  it("puts it in the agent's lane, still from the person who wrote it", () => {
    const amma = said("The kitchen downstairs");
    const after = savedReducer(fresh(), {
      type: "forward",
      listingId: "ellendale-64",
      messageId: amma.id,
      from: amma.from,
      text: amma.text,
    });
    const view = agentViewOf(ellendale, after);
    const sent = view.messages.find((m) => m.text === amma.text);
    expect(sent).toBeDefined();
    expect(sent!.from).toBe("amma");
    expect(sent!.forwarded).toBe(true);
    expect(sent!.when).toBe("Today");
  });

  it("leaves the family lane exactly as it was", () => {
    const amma = said("The kitchen downstairs");
    const after = savedReducer(fresh(), {
      type: "forward",
      listingId: "ellendale-64",
      messageId: amma.id,
      from: amma.from,
      text: amma.text,
    });
    expect(after.replies["ellendale-64"]).toBeUndefined();
  });

  it("sends once, however many times it is pressed", () => {
    const amma = said("The kitchen downstairs");
    const send = { type: "forward", listingId: "ellendale-64", messageId: amma.id, from: amma.from, text: amma.text } as const;
    const once = savedReducer(fresh(), send);
    const twice = savedReducer(once, send);
    expect(twice).toBe(once);
    expect(agentViewOf(ellendale, once).messages.filter((m) => m.text === amma.text)).toHaveLength(1);
  });

  it("says it has gone, and stops offering to send it again", () => {
    const amma = said("The kitchen downstairs");
    const after = savedReducer(fresh(), {
      type: "forward",
      listingId: "ellendale-64",
      messageId: amma.id,
      from: amma.from,
      text: amma.text,
    });
    expect(wasSent(amma, ellendale, after)).toBe(true);
    expect(isSendable(amma, ellendale, after)).toBe(false);
  });

  it("never offers to send the agent's own words back to her", () => {
    const hers = ellendale.withAgent.find((m) => CAST[m.from].tone === "agent");
    expect(hers).toBeDefined();
    expect(isSendable(hers!, ellendale, fresh())).toBe(false);
  });

  it("keeps a voice note a voice note when it crosses", () => {
    const amma = said("The kitchen downstairs");
    expect(amma.voice).toBeDefined();
    const after = savedReducer(fresh(), {
      type: "forward",
      listingId: "ellendale-64",
      messageId: amma.id,
      from: amma.from,
      text: amma.text,
      voice: amma.voice,
    });
    const sent = agentViewOf(ellendale, after).messages.find(
      (m) => m.text === amma.text,
    );
    expect(sent?.voice?.spoken?.lang).toBe("ta");
  });
});
