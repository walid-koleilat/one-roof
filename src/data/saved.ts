import { sourced, type Sourced } from "@/lib/domain/provenance";

/**
 * What happened to the homes she saved, and what everyone said about them.
 *
 * This is the file that makes the case for coming back. Everything else in
 * this product can be done somewhere else - a spreadsheet holds addresses, a
 * group chat holds opinions, an alert email holds new listings. What none of
 * them do is hold all three against the same house, in order, so that on a
 * Thursday in September the sentence "7 Galloway sold for twelve over asking,
 * and Amma never liked the road" is one thing rather than three.
 *
 * Four kinds of entry, deliberately kept apart:
 *
 *   `history` is what the market did. Not editable, and it is the part that
 *   only exists because she saved the home before it happened.
 *   `notes` are hers. Checkboxes before a visit, prose after one.
 *   `thread` is the family's. Her mother in Tamil, her sister, her husband
 *   asking about money. Anusha never sees it.
 *   `withAgent` is the lane Anusha reads: what she posted, what somebody in
 *   the family sent her, and the `papers` she put on file. The family sees
 *   this lane too. She sees only this lane.
 *
 * The split is the whole argument of the page. Arun names the ceiling in
 * three of these threads, and an agent is the one person who must never
 * learn it. So the family talks in one place, the agent in another, and a
 * message crosses from the first to the second only when the person who
 * wrote it sends it, and never when it is about the line.
 *
 * And one thing that sits across all of them: a `stage`, which is where she
 * has got to with a home. She sets it. Nothing here infers it from what the
 * market did, because "declared, never inferred" is the rule for anything
 * about her, and where she is in a purchase is about her.
 *
 * Every date is written as a phrase rather than a timestamp because that is
 * how a person holds a week. `WHEN_ORDER` places each phrase in that week so
 * a list can be sorted without pretending the phrase was ever a date.
 *
 * Who can speak on a home is governed by who it was shared with. Amma, Appa
 * and Rani are on the Bendale and Woburn searches; Arun is on Bendale and
 * Cedarbrae and on the collection made for his father-in-law. Anusha has a
 * seat on six homes and no others, and is never on a collection.
 */

const MOCK = { kind: "mock" as const, note: "Illustrative history for the prototype." };

/* ------------------------------------------------------------------ */
/* The cast                                                            */
/* ------------------------------------------------------------------ */

/**
 * Everyone who can appear in a thread or on a share, as an id rather than a
 * string. A `sharedWith: string[]` is how a person who exists nowhere else in
 * the product ended up in the fixture; making the id a union makes that a
 * type error instead of a review comment.
 */
export type PersonId = "nirosha" | "amma" | "appa" | "arun" | "rani" | "anusha";

export type Language = "en" | "ta";

export interface Person {
  id: PersonId;
  /** What the family calls them, which is what a row has room for. */
  name: string;
  /** The name on her card, for the one place the page introduces her. */
  fullName?: string;
  /** Shown under the name when the person is not family. */
  role?: string;
  /**
   * The languages this person has. Somebody with no English leaves notes
   * spoken, in Tamil, and a test holds the fixture to that. Anusha has both,
   * which is why she is the agent: the search asked for one who speaks Tamil.
   */
  speaks: readonly Language[];
  /** Family warm, the agent teal, her own ink. Never decorative. */
  tone: "family" | "agent" | "me";
}

export const CAST: Record<PersonId, Person> = {
  nirosha: { id: "nirosha", name: "Nirosha", speaks: ["en", "ta"], tone: "me" },
  amma: { id: "amma", name: "Amma", speaks: ["ta"], tone: "family" },
  appa: { id: "appa", name: "Appa", speaks: ["ta"], tone: "family" },
  arun: { id: "arun", name: "Arun", speaks: ["en"], tone: "family" },
  rani: { id: "rani", name: "Rani", speaks: ["en"], tone: "family" },
  anusha: {
    id: "anusha",
    name: "Anusha",
    fullName: "Anusha Rajaratnam",
    role: "Your agent",
    speaks: ["en", "ta"],
    tone: "agent",
  },
};

/** The one agent in the cast. Copy names her; nothing else about her is special-cased. */
export const AGENT: Person = CAST.anusha;

/** True when the person can read and write English. Otherwise their notes arrive spoken. */
export function hasEnglish(person: Person): boolean {
  return person.speaks.includes("en");
}

/* ------------------------------------------------------------------ */
/* Where a home has got to                                             */
/* ------------------------------------------------------------------ */

/**
 * The stage is a tag she puts on a home, and the page groups by it.
 *
 * `gone` is not `closing`. One is somebody else buying the house she wanted,
 * the other is her buying it, and the two must never wear the same colour.
 * Indigo is reserved for sold, and `gone` is the one that gets it.
 */
export type Stage = "to-view" | "visited" | "offer-in" | "closing" | "gone";

/** In the order a purchase runs, which is the order the pills list them. */
export const STAGES: readonly Stage[] = [
  "to-view",
  "visited",
  "offer-in",
  "closing",
  "gone",
];

/* ------------------------------------------------------------------ */
/* When                                                                */
/* ------------------------------------------------------------------ */

/**
 * Where each phrase the fixtures use sits in her week, as days from today.
 *
 * Today is a Thursday. "Yesterday" and "Wednesday" are the same day said two
 * ways, "Saturday" is the one just gone, and the phrases that point forward
 * exist for the conditions on an accepted offer and the day it closes. Two
 * phrases may land on the same day - "18 days ago" and "24 August" are both
 * true of the same listing - and that is fine; a phrase is how a person says
 * a date, not the date.
 *
 * Declared rather than parsed, because "Saturday" is not a date and turning
 * it into one would be the product inventing a calendar. A test asserts every
 * `when` in this file appears here, so adding a phrase without placing it
 * fails the build.
 */
export const WHEN_ORDER: Record<string, number> = {
  "61 days ago": -61,
  "12 August": -29,
  "14 August": -27,
  "24 days ago": -24,
  "18 August": -23,
  "20 August": -21,
  "18 days ago": -18,
  "24 August": -17,
  "28 August": -13,
  "29 August": -12,
  "9 days before": -12,
  "2 September": -8,
  "Last week": -8,
  "3 September": -7,
  "Last Thursday": -7,
  Saturday: -5,
  Sunday: -4,
  Monday: -3,
  Tuesday: -2,
  Wednesday: -1,
  Yesterday: -1,
  Today: 0,
  "this Saturday": 2,
  "by Tuesday": 5,
  "30 October": 50,
};

/* ------------------------------------------------------------------ */
/* The record                                                          */
/* ------------------------------------------------------------------ */

/**
 * What kind of thing happened, declared rather than read out of `what`.
 *
 * Three things need it: the week picks visits, the headline counts sales
 * and cuts, and a tile's last line comes from the newest one. String-matching
 * "Sold, $12,000 over asking" would be inference, and this file does not
 * infer.
 */
export type HistoryKind =
  | "listed"
  | "price"
  | "open-house"
  | "visit"
  | "offer"
  | "sold";

export interface HistoryEvent {
  id: string;
  what: string;
  when: string;
  kind: HistoryKind;
  /** The one that matters gets the dot. At most one per home. */
  weight?: "notable";
}

export interface Note {
  id: string;
  what: string;
  done?: boolean;
}

/**
 * A voice note, transcribed.
 *
 * `spoken` is what was actually said, when it was not said in English. Amma's
 * notes always carry it: she has no English, she is the person the house is
 * for, and deleting the Tamil would make her contribution look like it came
 * from a machine. A note recorded in this session has no `spoken` and no
 * transcript, and the panel says so rather than inventing one.
 */
export interface VoiceClip {
  /** "0:14". A duration, not a timestamp. */
  seconds: string;
  spoken?: { lang: "ta"; text: string };
}

export interface Message {
  id: string;
  from: PersonId;
  when: string;
  /** What she reads. For a voice note, the English of what was said. */
  text: string;
  voice?: VoiceClip;
  /**
   * Three or four words for the tile's last line, where the message is the
   * newest thing that happened to the house.
   *
   * Authored rather than derived, for the same reason a history event
   * carries its own `what`: a tile has room for four words and there is no
   * honest way to get four words out of a paragraph without a model reading
   * it. Where it is absent the tile says what the person did - left a note,
   * left a voice note, answered - which is true of every message.
   */
  gist?: string;
  /**
   * Declared when the message is about her line. Arun's all are. A message
   * about the budget is never sent to the agent however it is worded: the
   * product can find "$1,190,000" in a sentence, but it cannot know that
   * "$25,000 over" gives the ceiling away to anyone who has the asking price,
   * so the fixture says which messages these are rather than guessing.
   */
  about?: "budget";
  /** Sent to Anusha out of the family lane, by the person who wrote it. */
  forwarded?: true;
}

/**
 * A paper on a home: on file, with who put it there and when, or still owed.
 *
 * Papers are the reason an agent is on a house at all. The permit print,
 * the signed offer, the inspection report - these are hers to fetch and file,
 * and the family reads them here rather than in six email threads. A paper
 * carries no budget figure by construction: it has a name and a date, never
 * a body, and a test holds every name to that.
 */
export type Paper =
  | { id: string; what: string; state: "on-file"; from: PersonId; when: string }
  | { id: string; what: string; state: "owed"; due: string };

/**
 * One condition on an accepted offer, and whose job it is.
 *
 * `by` is a phrase `WHEN_ORDER` places; once the condition is done it is the
 * day it cleared. `holder` is what to call the person when it is not one
 * person in the cast - "You and Arun" on the deposit, "Arun's bank" on the
 * financing - and `who` still names the one in the cast it belongs to.
 */
export interface Condition {
  id: string;
  what: string;
  by: string;
  who: PersonId;
  holder?: string;
  done?: boolean;
}

export interface SavedHome {
  listingId: string;
  savedOn: string;
  /** Where she has got to. Absent means saved, and nothing more yet. */
  stage?: Stage;
  /**
   * Anusha has a seat on this one. Off unless Nirosha put her on it, and
   * only Nirosha can. The seat is per home, never per box or per search:
   * the agent sees the houses she was asked about and nothing around them.
   */
  agent?: true;
  /** Set at closing: the day the keys change hands. A date, not a condition. */
  closes?: string;
  /** Set only at `closing`. */
  conditions?: readonly Condition[];
  /** Set when it is gone, which is the strongest argument on the page. */
  sold?: { price: Sourced<number>; over: string; days: string };
  history: readonly HistoryEvent[];
  notesTitle?: string;
  notes: readonly Note[];
  /** Free prose she wrote after standing in it. */
  afterVisit?: string;
  /** The family lane. Anusha does not see it. */
  thread: readonly Message[];
  /** The lane with Anusha. She reads it; the family sees it too. */
  withAgent: readonly Message[];
  /** On file, or owed. */
  papers: readonly Paper[];
}

export interface SavedSearch {
  id: string;
  name: string;
  savedOn: string;
  /** How many homes she has saved out of this search. */
  homeIds: readonly string[];
  /** New matches since she last looked, if any. */
  newIds: readonly string[];
  sharedWith: readonly PersonId[];
  criteria: readonly string[];
}

/**
 * A collection she named, holding homes from any search.
 *
 * A search is active - it keeps running and it is the only thing here that
 * can email her. A collection is passive on purpose. It has no `newIds` and
 * there is no field it could grow from; a test asserts the absence, the same
 * way `counts.test.ts` asserts a listing has no `couldRent`.
 */
export interface Collection {
  id: string;
  /** Her words. The name is the whole object; there is no description. */
  name: string;
  /** Why, if she said. One line, hers. */
  because?: string;
  madeOn: string;
  /** Membership lives here, mirroring `SavedSearch.homeIds`. */
  homeIds: readonly string[];
  /** Family only. The agent is never on a collection, and the reducer refuses her. */
  sharedWith: readonly PersonId[];
  /** A conversation about the set, not about any one house. */
  thread: readonly Message[];
}

/* ------------------------------------------------------------------ */
/* Ids                                                                 */
/* ------------------------------------------------------------------ */

/**
 * The fixture is authored without ids and stamped at module load.
 *
 * `key={message.text}` collides the first time she adds the same line to two
 * homes. Hand-writing sixty ids into a file people edit by feel is how ids go
 * missing. Stamping is deterministic - `ellendale-64-m1` - so the server and
 * the client agree, and nobody can add an entry without one.
 */
type Unstamped<T extends { id: string }> = Omit<T, "id">;

/**
 * `Omit` over a union keeps only the keys every member shares, so
 * `Omit<Paper, "id">` would drop `from`, `when` and `due`. Distribute it, so
 * each arm of `Paper` is stamped as itself.
 */
type UnstampedUnion<T extends { id: string }> = T extends unknown
  ? Omit<T, "id">
  : never;

interface RawSavedHome
  extends Omit<
    SavedHome,
    "history" | "notes" | "thread" | "withAgent" | "papers" | "conditions"
  > {
  history: readonly Unstamped<HistoryEvent>[];
  notes: readonly Unstamped<Note>[];
  thread: readonly Unstamped<Message>[];
  withAgent?: readonly Unstamped<Message>[];
  papers?: readonly UnstampedUnion<Paper>[];
  conditions?: readonly Unstamped<Condition>[];
}

interface RawCollection extends Omit<Collection, "thread"> {
  thread: readonly Unstamped<Message>[];
}

function stampHome(h: RawSavedHome): SavedHome {
  const id = h.listingId;
  return {
    ...h,
    history: h.history.map((e, i) => ({ ...e, id: `${id}-h${i}` })),
    notes: h.notes.map((n, i) => ({ ...n, id: `${id}-n${i}` })),
    thread: h.thread.map((m, i) => ({ ...m, id: `${id}-m${i}` })),
    withAgent: (h.withAgent ?? []).map((m, i) => ({ ...m, id: `${id}-a${i}` })),
    papers: (h.papers ?? []).map(
      (p, i) => ({ ...p, id: `${id}-p${i}` }) as Paper,
    ),
    conditions: h.conditions?.map((c, i) => ({ ...c, id: `${id}-c${i}` })),
  };
}

function stampCollection(c: RawCollection): Collection {
  return {
    ...c,
    thread: c.thread.map((m, i) => ({ ...m, id: `${c.id}-m${i}` })),
  };
}

/** A voice note in Tamil, with the English she reads under it. */
function ta(seconds: string, text: string): VoiceClip {
  return { seconds, spoken: { lang: "ta", text } };
}

/* ------------------------------------------------------------------ */
/* The searches                                                        */
/* ------------------------------------------------------------------ */

export const SAVED_SEARCHES: readonly SavedSearch[] = [
  {
    id: "bendale-suite",
    name: "Bendale, legal suite",
    savedOn: "12 August",
    homeIds: [
      "ellendale-64",
      "bellamy-18",
      "galloway-7",
      "painted-post-201",
      "pitfield-32",
    ],
    newIds: ["ellesmere-40", "brimley-7"],
    sharedWith: ["amma", "arun", "rani"],
    criteria: [
      "A multigenerational home",
      "Bendale",
      "Under $1,250,000",
      "A legal suite already",
      "Bed and bath on the ground floor",
    ],
  },
  {
    id: "woburn-main",
    name: "Woburn, main floor",
    savedOn: "28 August",
    homeIds: ["coatsbrae-28", "morningside-145", "fenwood-9"],
    newIds: [],
    // She took her parents to see two of these. They are on it.
    sharedWith: ["amma", "appa", "rani"],
    criteria: ["A bungalow, any size", "Woburn", "Under $1,350,000"],
  },
  {
    id: "cedarbrae-add",
    name: "Cedarbrae, room to add",
    savedOn: "3 September",
    homeIds: ["marcos-61", "kecala-12", "brimley-7"],
    newIds: ["ellesmere-40"],
    sharedWith: ["arun"],
    criteria: ["A multigenerational home", "Cedarbrae", "Room to add a legal suite"],
  },
];

/** Every home she has saved, across every search, counted once. */
export function savedHomeIds(): readonly string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const search of SAVED_SEARCHES) {
    for (const id of search.homeIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* The homes                                                           */
/* ------------------------------------------------------------------ */

/**
 * Eleven, one for every home she saved. The five from Bendale were the whole
 * fixture for a while, and picking Woburn or Cedarbrae in the rail showed six
 * cards saying nothing had happened. `counts.test.ts` now fails if a saved
 * home has no record.
 *
 * The bracket every budget line here is measured against is $1,190,000 to
 * $1,290,000 - see `src/data/budget.ts`. Arun's arithmetic is against that,
 * and every message of his that does the arithmetic is marked `about:
 * "budget"`, which is what keeps it out of Anusha's lane.
 */
const RAW_SAVED_HOMES: readonly RawSavedHome[] = [
  /* --- Bendale, legal suite --------------------------------------- */
  {
    listingId: "ellendale-64",
    savedOn: "24 August",
    stage: "closing",
    agent: true,
    closes: "30 October",
    history: [
      {
        what: "Offer accepted at $1,181,000, conditional",
        when: "Tuesday",
        kind: "offer",
        weight: "notable",
      },
      { what: "Open house, eleven people through", when: "Sunday", kind: "open-house" },
      { what: "You and Amma went to see it", when: "Saturday", kind: "visit" },
      { what: "Listed at $1,189,000", when: "18 days ago", kind: "listed" },
    ],
    notesTitle: "Before the keys",
    notes: [
      { what: "Measure the basement ceiling. It needs 6 ft 5 in.", done: true },
      { what: "Ask where Amma's washing machine would go." },
      { what: "Get the handrail quoted before the 30th." },
    ],
    thread: [
      {
        from: "amma",
        when: "Sunday",
        text: "The kitchen downstairs has a window. I could cook there.",
        voice: ta("0:14", "கீழ குசினிக்கு ஒரு யன்னல் இருக்கு. நான் அங்க சமைக்கலாம்."),
      },
      {
        from: "arun",
        when: "Monday",
        text: "If it goes to $1,185,000 are we still inside? I had $1,190,000 as the line.",
        about: "budget",
      },
    ],
    withAgent: [
      {
        from: "nirosha",
        when: "Yesterday",
        text: "Where would a rail bolt on. Brick or siding.",
        forwarded: true,
      },
      {
        from: "anusha",
        when: "Today",
        text: "A rail bolts to brick, not to siding. The front is brick to the door. I will measure the step on Saturday.",
        gist: "a rail bolts to brick",
      },
    ],
    papers: [
      {
        what: "Permit print, suite finished 2018",
        state: "on-file",
        from: "anusha",
        when: "Tuesday",
      },
      {
        what: "Offer and Schedule A, signed",
        state: "on-file",
        from: "anusha",
        when: "Tuesday",
      },
      { what: "Inspection report", state: "owed", due: "this Saturday" },
    ],
    conditions: [
      {
        what: "Deposit, bank draft",
        by: "Wednesday",
        who: "nirosha",
        holder: "you and Arun",
        done: true,
      },
      { what: "Inspection", by: "this Saturday", who: "anusha" },
      {
        what: "Financing, letter in hand",
        by: "by Tuesday",
        who: "arun",
        holder: "Arun's bank",
      },
    ],
  },
  {
    listingId: "bellamy-18",
    savedOn: "20 August",
    stage: "visited",
    history: [{ what: "You and Appa went to see it", when: "24 August", kind: "visit" }],
    notesTitle: "After the visit, 24 August",
    notes: [],
    afterVisit:
      "Bright at the back and the suite is bigger than the photographs. The front steps are the problem. Four of them and no rail.",
    thread: [
      {
        from: "amma",
        when: "Last week",
        text: "Four steps to the front door and no rail. Your father cannot do that every day.",
        voice: ta(
          "0:38",
          "முன் கதவுக்கு நாலு படி, கைப்பிடியும் இல்ல. உன்ர அப்பாவால அது நாளாந்தம் ஏலாது.",
        ),
      },
      {
        from: "rani",
        when: "Last week",
        text: "A ramp is nothing. Do not write it off for that.",
      },
    ],
  },
  {
    listingId: "galloway-7",
    savedOn: "29 August",
    stage: "gone",
    agent: true,
    sold: {
      price: sourced(1_352_000, MOCK),
      over: "$12,000 over asking",
      days: "nine days on the market",
    },
    history: [
      { what: "Sold, $12,000 over asking", when: "Monday", kind: "sold", weight: "notable" },
      { what: "Offers held, four registered", when: "Last Thursday", kind: "offer" },
      { what: "Listed at $1,340,000", when: "9 days before", kind: "listed" },
    ],
    notes: [],
    thread: [
      {
        from: "amma",
        when: "Monday",
        text: "Good. I did not like that road anyway.",
        voice: ta("0:06", "நல்லது. இல்லாட்டிலும் எனக்கு அந்த ரோடு பிடிக்கேல்ல."),
      },
    ],
    withAgent: [
      {
        from: "anusha",
        when: "Monday",
        text: "This one had no permit and it still went over. Worth knowing when we write an offer on Ellendale.",
        gist: "no permit, still went over",
      },
    ],
  },
  {
    listingId: "painted-post-201",
    savedOn: "18 August",
    stage: "offer-in",
    agent: true,
    history: [
      { what: "Down $36,000", when: "Tuesday", kind: "price" },
      {
        what: "Offer in at $1,195,000, waiting",
        when: "Monday",
        kind: "offer",
        weight: "notable",
      },
      { what: "You and Arun went through it", when: "Sunday", kind: "visit" },
      { what: "Listed at $1,265,000", when: "61 days ago", kind: "listed" },
    ],
    notesTitle: "Before it goes firm",
    notes: [{ what: "Stand in the suite while someone walks upstairs. Listen." }],
    thread: [
      {
        from: "arun",
        when: "Monday",
        text: "$1,195,000 is $5,000 past the inside line. What happens if the semi gets less than we said?",
        about: "budget",
      },
    ],
    withAgent: [
      {
        from: "anusha",
        when: "Tuesday",
        text: "They cut to $1,229,000 on Tuesday and have not answered at $1,195,000. Sixty-one days on.",
        gist: "no answer on the offer",
      },
    ],
    papers: [
      {
        what: "Offer at $1,195,000, signed",
        state: "on-file",
        from: "anusha",
        when: "Monday",
      },
    ],
  },
  {
    listingId: "pitfield-32",
    savedOn: "2 September",
    history: [],
    notes: [],
    thread: [],
  },

  /* --- Woburn, main floor ----------------------------------------- */
  {
    listingId: "coatsbrae-28",
    savedOn: "29 August",
    stage: "to-view",
    agent: true,
    history: [
      {
        what: "Listed for the third time, $1,315,000",
        when: "2 September",
        kind: "listed",
        weight: "notable",
      },
      { what: "Listed for the second time, $1,315,000", when: "24 days ago", kind: "listed" },
      { what: "Listed at $1,315,000", when: "61 days ago", kind: "listed" },
    ],
    notesTitle: "Take this if we go",
    notes: [
      { what: "Count the steps from their room to the kitchen." },
      { what: "Where the washer is. He cannot carry a basket downstairs." },
    ],
    thread: [
      {
        from: "arun",
        when: "Saturday",
        text: "The only one on the Woburn list over the ceiling, and by $25,000. Remind me why we are keeping it.",
        about: "budget",
      },
      {
        from: "rani",
        when: "Tuesday",
        text: "Because Appa gets in with no step and does not climb to bed, Arun. It stays until we have stood in it.",
      },
    ],
    withAgent: [
      {
        from: "anusha",
        when: "Monday",
        text: "The record shows it on three times since spring, all at $1,315,000, and none of them sold. That usually means an accepted offer with a condition that did not clear.",
        gist: "relisted, third time",
      },
    ],
  },
  {
    listingId: "morningside-145",
    savedOn: "2 September",
    // The market did something to this one and nobody has said a word.
    history: [
      { what: "Down $40,000", when: "Last week", kind: "price", weight: "notable" },
      { what: "Listed at $1,308,000", when: "24 days ago", kind: "listed" },
    ],
    notes: [],
    thread: [],
  },
  {
    listingId: "fenwood-9",
    savedOn: "28 August",
    stage: "visited",
    history: [
      { what: "Open house, nobody stayed long", when: "Sunday", kind: "open-house" },
      { what: "Appa walked in from the car", when: "Saturday", kind: "visit", weight: "notable" },
      { what: "Listed at $1,092,000", when: "24 August", kind: "listed" },
    ],
    notesTitle: "After the visit, Saturday",
    notes: [
      { what: "Walk the ramp with Appa. Note the slope.", done: true },
      { what: "See if a wheelchair turns in the bathroom.", done: true },
      { what: "Listen through the bedroom wall with the TV on." },
    ],
    afterVisit:
      "Appa went from the car to the bedroom without a step. The bathroom turns a chair. One kitchen and nowhere to put a second. It works for him and not for her.",
    thread: [
      {
        from: "appa",
        when: "Saturday",
        text: "From the car to the bed I went on my own. I did not hold anyone's arm.",
        voice: ta(
          "0:08",
          "கார்ல இருந்து கட்டில் வரைக்கும் நான் தனிய போனன். ஆருடைய கையும் பிடிக்கேல்ல.",
        ),
      },
      {
        from: "amma",
        when: "Saturday",
        text: "One kitchen, so whose is it, mine or yours? I will not fry fish with your children's clothes in the next room.",
        voice: ta(
          "0:22",
          "ஒரே ஒரு குசினி எண்டா அது யார்ர குசினி, என்ரதா உன்ரதா? பக்கத்து ரூமில உன்ர பிள்ளையளின்ர உடுப்பு இருக்கேக்க நான் மீன் பொரிக்க மாட்டன்.",
        ),
      },
      {
        from: "arun",
        when: "Sunday",
        text: "Inside by $98,000 at the low end of the bracket. Holds even if the semi gets less.",
        about: "budget",
      },
      {
        from: "rani",
        when: "Monday",
        text: "A second stove is a wall and a plumber, and the ramp is already there. Do not lose it over fish.",
      },
    ],
  },

  /* --- Cedarbrae, room to add ------------------------------------- */
  {
    listingId: "marcos-61",
    savedOn: "3 September",
    stage: "to-view",
    history: [
      {
        what: "Visit booked, this Saturday 11am",
        when: "Yesterday",
        kind: "visit",
        weight: "notable",
      },
      { what: "Listed at $1,168,000", when: "2 September", kind: "listed" },
    ],
    notesTitle: "Take this when we go",
    notes: [
      { what: "Is the bathroom door wide enough for a chair?" },
      { what: "Basement ceiling, and where Amma's kitchen would go." },
    ],
    thread: [
      {
        from: "amma",
        when: "Tuesday",
        text: "I looked at the pictures. Not one step at the front door, and your father could manage this one.",
        voice: ta(
          "0:17",
          "படங்கள் பாத்தன். முன்வாசலில ஒரு படியும் இல்லை, அப்பா இதை சமாளிப்பார்.",
        ),
      },
    ],
  },
  {
    listingId: "kecala-12",
    savedOn: "3 September",
    agent: true,
    history: [{ what: "Listed at $1,218,000", when: "2 September", kind: "listed" }],
    notes: [],
    thread: [],
    withAgent: [
      {
        from: "anusha",
        when: "Monday",
        text: "The suite has had the same tenant for six years. Under Ontario rules, a family member moving in needs an N12 and sixty days' notice, and the tenant may be owed a month's rent.",
        gist: "tenant notice",
      },
    ],
  },
  {
    listingId: "brimley-7",
    savedOn: "Yesterday",
    stage: "to-view",
    agent: true,
    history: [
      { what: "Listed at $1,142,000", when: "Yesterday", kind: "listed", weight: "notable" },
    ],
    notesTitle: "When we go",
    notes: [{ what: "Which level their bedroom is on. It is a split." }],
    thread: [],
    withAgent: [
      {
        from: "anusha",
        when: "Today",
        text: "Their agent took the photographs herself, no photographer. What looks dim in them is dim, and what looks bright is bright.",
        gist: "her own photographs",
      },
    ],
  },
];

export const SAVED_HOMES: readonly SavedHome[] = RAW_SAVED_HOMES.map(stampHome);

/* ------------------------------------------------------------------ */
/* The collections                                                     */
/* ------------------------------------------------------------------ */

/**
 * Two collections, crossing searches on purpose.
 *
 * "Ones Appa can manage" spans Woburn and Cedarbrae because step-free access
 * was never a facet she searched on. That is the case for collections
 * existing at all: homes she is keeping that no one search can hold.
 * `marcos-61` is in both, so many-to-many is visible rather than theoretical.
 *
 * A collection's thread is about the set. A note about one house still lives
 * on that house. And a collection is family only: there is no agent lane on
 * a set, because there is no paper on a set and nothing for an agent to hold.
 */
const RAW_COLLECTIONS: readonly RawCollection[] = [
  {
    id: "appa-can-manage",
    name: "Ones Appa can manage",
    because: "No step at the front, and a bathroom he does not have to climb to.",
    madeOn: "29 August",
    homeIds: ["fenwood-9", "marcos-61", "coatsbrae-28"],
    sharedWith: ["arun"],
    thread: [
      {
        from: "arun",
        when: "Yesterday",
        text: "Two of the three are inside. Coatsbrae is $25,000 over, so it is a different conversation until it moves.",
        about: "budget",
      },
      {
        from: "nirosha",
        when: "Yesterday",
        text: "It is the only one where Appa gets a room and a bathroom on a floor of his own. It has been listed three times since spring, and they will come down.",
      },
    ],
  },
  {
    id: "amma-liked",
    name: "Amma liked",
    because: "The three she picked from the photographs.",
    madeOn: "2 September",
    homeIds: ["ellendale-64", "kecala-12", "marcos-61"],
    sharedWith: ["amma", "rani"],
    thread: [
      {
        from: "amma",
        when: "Tuesday",
        text: "Ellendale, because the kitchen downstairs has a window and the smell goes out. At Marcos I would be cooking in your kitchen every day.",
        voice: ta(
          "0:17",
          "எல்லன்டேல் தான். கீழை குசினியிலை யன்னல் இருக்கு, நெடி வெளியை போகும். மார்க்கோஸில நான் நாளும் உன்ர குசினியிலை தான் சமைக்க வேணும்.",
        ),
      },
      {
        from: "rani",
        when: "Yesterday",
        text: "You can put a fan over a stove. Marcos is the only one of the three Appa gets into without a step.",
      },
    ],
  },
];

export const SAVED_COLLECTIONS: readonly Collection[] =
  RAW_COLLECTIONS.map(stampCollection);
