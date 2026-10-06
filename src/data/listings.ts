import type { Metrics, SuiteStatus } from "@/lib/domain/listing";
import { sourced, type Sourced } from "@/lib/domain/provenance";

/**
 * Every home this prototype shows, in one place. Invented, and labelled so.
 *
 * One place is the whole point. The four screens were designed separately and
 * drifted: the search page had grown its own addresses that reused prices from
 * the chat page, so the same house appeared twice under different names. A
 * reviewer who noticed would have been right to stop reading. Every address in
 * every screen is now a row in this file, and a screen that wants a subset
 * filters it rather than writing its own.
 *
 * Every price carries `mock` provenance rather than sitting here as a bare
 * number. The prototype is not allowed to imply it is reading a live feed, and
 * the type enforces it: a component cannot render one of these without having
 * been handed the provenance too.
 *
 * `ourEstimate` is deliberately separate from `askingPrice`. The whole
 * "$14k under" idea only means something if the two are different fields with
 * different sources - one is what the seller wants, one is what we think.
 */

/**
 * Where a claim on the card came from.
 *
 * `computed` is the one distinction a reader needs at a glance: a source we
 * did not make, such as the city's own file, against one we did, such as a
 * photograph we read. The card draws the first with a solid outline and the
 * second with a dashed one, so the weaker source looks weaker without a word
 * of copy - and nothing warm goes anywhere near either.
 */
export interface ProofSource {
  label: string;
  computed: boolean;
}

export interface Proof {
  photo: string;
  caption: string;
  /**
   * Every source behind the caption, in the order they should be read.
   *
   * Never empty. The moment an image is offered as evidence it has to say
   * where it came from, or it is a photograph pretending to be a record.
   */
  sources: readonly ProofSource[];
}

export interface Listing {
  id: string;
  address: string;
  /** Short form for the ad card, where three cards share 730px. */
  neighbourhood: string;
  askingPrice: Sourced<number>;
  /** One Roof's own estimate. The thing "under" and "over" compare against. */
  ourEstimate: Sourced<number>;
  suite: SuiteStatus;
  metrics: Metrics;
  /**
   * One line of shape, and deliberately not a restatement of the suite label
   * above it. "Bungalow. Own kitchen and own door." under a teal line reading
   * "Own kitchen and own door" spends a line of a 200px card saying nothing.
   *
   * Both this and `access` are bullets on the card and must survive a narrow
   * column on one line, so they are held to about twenty-three characters.
   * Past that the card truncates, and a fact cut to "Bungalow, basement 7 ..."
   * is worse than no fact at all.
   */
  form: string;
  /**
   * One line of access, written for somebody who has just had a fall.
   *
   * It deliberately does not repeat the minutes - the travel row on the card
   * already carries those - so this is the part a drive time cannot tell you:
   * how many steps stand between the pavement and the front door.
   */
  access: string;
  /**
   * What the house is, in one line, for the top of a card.
   *
   * Deliberately not `note`. This says what she is looking at; `note` says the
   * thing that would decide an offer. A card leading with "4 bed - 3 bath -
   * 2 kitchens" leads with the listing's summary of itself, and every home in
   * the row says something close enough to be useless.
   *
   * It opens with the neighbourhood: "Bendale bungalow. The suite is at the
   * back." On today's portals the address is free, so the card leads with it
   * and the neighbourhood, which used to be the heading, moves into the
   * sentence. `listings.test.ts` holds every row to that.
   */
  summary: string;
  /**
   * The photograph that backs up the claim on the card, and a caption saying
   * what it shows.
   *
   * The street view sells the house; it cannot tell her whether her mother has
   * her own kitchen or whether there are stairs. The claim on the card links
   * to this instead, so the evidence sits one press from the assertion, and
   * the sources sit under the evidence.
   *
   * Every home has one, and it is always one of the home's own `photos`. The
   * board draws the underlined claim with its thumbnail on every card, and a
   * card that could not open its evidence would be the one card she had to
   * take on trust. Optional in the type only because a listing can exist
   * before anyone has read its photographs; the data test says none does.
   */
  proof?: Proof;
  /**
   * The sentence a person would say about this house.
   *
   * Not a feature and not a selling line. "Both units are empty. Nobody has to
   * move out first." is the kind of thing that decides an offer and never
   * appears in a listing field.
   */
  note: string;
  /** What the city record actually says, or that there is none. */
  permit: string;
  /** Minutes to Scarborough General, from this address rather than the postal code. */
  driveMinutes: number;
  /** Minutes to the nearest bus stop. She does not drive, so this is a filter. */
  transitMinutes: number;
  /**
   * Every photograph of this home: the street first, then inside.
   *
   * Inside is the point. She is not choosing between brick exteriors, she is
   * asking whether her mother can live down there, so the frames after the
   * cover are the suite's kitchen, its bedroom and the way in - or, at
   * 7 Galloway, the low unfinished basement that is the reason it does not
   * qualify. They are generated rather than photographed, which the site
   * says out loud, and the same generated interior can
   * stand behind more than one address for the same reason: none of them is
   * a photograph of any of these houses. A home with only a street view gets
   * one interior, so the evidence it offers is one of its own frames.
   */
  photos: readonly string[];
  /** Flat tone behind the photograph while it loads. */
  photoTint: string;
  /**
   * The one chip worth putting on the photograph, if there is one.
   *
   * Most homes have none. A tag on every card is wallpaper, and the two that
   * matter here - a price that moved and a listing that keeps coming back -
   * only mean something because they are rare.
   */
  tag?: { label: string; tone: "neutral" | "warm" | "authority" };
  /** What it was asking before, when the price has moved. */
  previousPrice?: Sourced<number>;
}

const MOCK = {
  kind: "mock" as const,
  note: "Illustrative listing for the prototype. Not a real property.",
};

const ESTIMATE = {
  kind: "mock" as const,
  note: "Illustrative estimate. The real one comes from the comps model.",
};

/** The city's own file. Not ours, so it draws with a solid outline. */
const CITY_RECORDS: ProofSource = {
  label: "City permit records",
  computed: false,
};
/** Our own read of the photograph. Dashed, because we made it. */
const PHOTO_READ: ProofSource = { label: "Photo read by us", computed: true };


export const BENDALE: Listing = {
  id: "ellendale-64",
  summary: "Bendale bungalow. The suite is at the back, with its own way in.",
  proof: {
    photo: "/homes/bendale-kitchen.jpg",
    caption: "The suite's own kitchen, at the back of the house.",
    sources: [CITY_RECORDS, PHOTO_READ],
  },
  address: "64 Ellendale Drive",
  neighbourhood: "Bendale",
  askingPrice: sourced(1_189_000, MOCK),
  ourEstimate: sourced(1_203_000, ESTIMATE),
  suite: "legal-suite",
  metrics: { beds: 4, baths: 3, kitchens: 2, lot: "41 x 128 ft" },
  form: "Bungalow, suite at back",
  access: "Three steps to the door",
  note: "Four steps and a wide entrance door. No handrail on either side.",
  permit: "Permit on file with the city",
  driveMinutes: 8,
  transitMinutes: 2,
  photos: [
    "/homes/bendale.jpg",
    "/homes/bendale-living.jpg",
    "/homes/bendale-kitchen.jpg",
    "/homes/bendale-bedroom.jpg",
  ],
  photoTint: "#DCE4E3",
};

export const BELLAMY: Listing = {
  id: "bellamy-18",
  summary: "Woburn two-storey. The suite has its own entrance off the drive.",
  proof: {
    photo: "/homes/woburn-entrance.jpg",
    caption: "Its own entrance, off the drive.",
    sources: [CITY_RECORDS, PHOTO_READ],
  },
  address: "18 Bellamy Road",
  neighbourhood: "Woburn",
  askingPrice: sourced(1_360_000, MOCK),
  ourEstimate: sourced(1_360_000, ESTIMATE),
  suite: "legal-suite",
  metrics: { beds: 4, baths: 2, kitchens: 2, lot: "36 x 115 ft" },
  form: "Own entrance off drive",
  access: "Four steps to the door",
  note: "Its own hydro meter. The bills stay separate.",
  permit: "Permit on file with the city",
  driveMinutes: 9,
  transitMinutes: 3,
  photos: [
    "/homes/bellamy.jpg",
    "/homes/woburn-living.jpg",
    "/homes/woburn-kitchen.jpg",
    "/homes/woburn-entrance.jpg",
  ],
  photoTint: "#E2DED8",
};

export const MORNINGSIDE: Listing = {
  id: "morningside-145",
  summary:
    "West Hill one-and-a-half storey. Garden walk-out suite, and the path to it is flat.",
  proof: {
    photo: "/homes/morningside-walkout.jpg",
    caption: "The garden walk-out, level with the path.",
    sources: [CITY_RECORDS, PHOTO_READ],
  },
  address: "145 Morningside Avenue",
  neighbourhood: "West Hill",
  askingPrice: sourced(1_268_000, MOCK),
  ourEstimate: sourced(1_279_000, ESTIMATE),
  suite: "legal-suite",
  metrics: { beds: 4, baths: 3, kitchens: 2, lot: "50 x 125 ft" },
  form: "Garden walk-out suite",
  access: "Flat path to the door",
  note: "Flat path to the door. No step to get in.",
  permit: "Permit on file, 2019",
  driveMinutes: 6,
  transitMinutes: 4,
  photos: [
    "/homes/ellendale.jpg",
    "/homes/morningside-living.jpg",
    "/homes/morningside-walkout.jpg",
    "/homes/morningside-kitchen.jpg",
  ],
  photoTint: "#DCE4E3",
  tag: { label: "Price cut $40,000", tone: "warm" },
  previousPrice: sourced(1_308_000, MOCK),
};

export const GALLOWAY: Listing = {
  id: "galloway-7",
  summary:
    "Highland Creek bungalow. No suite yet. The basement is tall enough to become one.",
  proof: {
    photo: "/homes/galloway-basement.jpg",
    caption: "The basement, shot to show the ceiling.",
    sources: [PHOTO_READ],
  },
  address: "7 Galloway Road",
  neighbourhood: "Highland Creek",
  askingPrice: sourced(1_340_000, MOCK),
  ourEstimate: sourced(1_349_000, ESTIMATE),
  suite: "could-convert",
  metrics: { beds: 4, baths: 2, kitchens: 1, lot: "44 x 120 ft" },
  form: "Basement is 7 ft 2 in",
  access: "Six steps to the door",
  note: "A kitchen downstairs and no record of it at the city.",
  permit: "No permit on record",
  driveMinutes: 14,
  transitMinutes: 6,
  photos: [
    "/homes/highland-creek.jpg",
    "/homes/galloway-living.jpg",
    "/homes/galloway-basement.jpg",
    "/homes/galloway-kitchen.jpg",
  ],
  photoTint: "#D9DEE3",
};

export const PAINTED_POST: Listing = {
  id: "painted-post-201",
  summary: "Bendale two-storey. Two front doors, and one step at either of them.",
  proof: {
    photo: "/homes/woburn-kitchen.jpg",
    caption: "The suite's kitchen, behind the second front door.",
    sources: [CITY_RECORDS, PHOTO_READ],
  },
  address: "201 Painted Post Drive",
  neighbourhood: "Bendale",
  askingPrice: sourced(1_229_000, MOCK),
  ourEstimate: sourced(1_250_000, ESTIMATE),
  suite: "legal-suite",
  metrics: { beds: 4, baths: 3, kitchens: 2, lot: "48 x 120 ft" },
  form: "Two front doors",
  access: "One step at the door",
  note: "Sixty-one days and a cut. They will take less again.",
  permit: "Permit on file with the city",
  driveMinutes: 9,
  transitMinutes: 3,
  photos: ["/homes/painted-post.jpg", "/homes/woburn-kitchen.jpg"],
  photoTint: "#DFE0DA",
  tag: { label: "Price cut Tuesday", tone: "warm" },
  previousPrice: sourced(1_265_000, MOCK),
};

export const PITFIELD: Listing = {
  id: "pitfield-32",
  summary: "Bendale bungalow. A kitchen downstairs, and its own door at the side.",
  proof: {
    photo: "/homes/galloway-kitchen.jpg",
    caption: "The kitchen downstairs. Nobody official has seen it.",
    sources: [CITY_RECORDS, PHOTO_READ],
  },
  address: "32 Pitfield Road",
  neighbourhood: "Bendale",
  askingPrice: sourced(1_155_000, MOCK),
  ourEstimate: sourced(1_163_000, ESTIMATE),
  suite: "no-permit",
  metrics: { beds: 4, baths: 2, kitchens: 2, lot: "40 x 120 ft" },
  form: "Its own door at the side",
  access: "Two steps to the door",
  note: "A kitchen downstairs, and the city has no record of it.",
  permit: "No permit on record",
  driveMinutes: 10,
  transitMinutes: 4,
  photos: ["/homes/pitfield.jpg", "/homes/galloway-kitchen.jpg"],
  photoTint: "#E0DCD6",
};

export const FENWOOD: Listing = {
  id: "fenwood-9",
  summary: "Cliffcrest bungalow. All on one level, with a ramp at the side door.",
  proof: {
    photo: "/homes/morningside-living.jpg",
    caption: "The front room, all on the one level. Their room and bath are off it.",
    sources: [PHOTO_READ],
  },
  address: "9 Fenwood Heights",
  neighbourhood: "Cliffcrest",
  askingPrice: sourced(1_092_000, MOCK),
  ourEstimate: sourced(1_092_000, ESTIMATE),
  suite: "ground-floor",
  metrics: { beds: 4, baths: 2, kitchens: 1, lot: "45 x 110 ft" },
  form: "All on one level",
  access: "Ramp at the side door",
  note: "The cheapest thing this search has found.",
  permit: "Ground-floor bed and bath",
  driveMinutes: 13,
  transitMinutes: 5,
  photos: ["/homes/fenwood.jpg", "/homes/morningside-living.jpg"],
  photoTint: "#DDE1E4",
};

export const COATSBRAE: Listing = {
  id: "coatsbrae-28",
  summary: "Woburn back split. One level in from the front, no step.",
  proof: {
    photo: "/homes/bendale-living.jpg",
    caption:
      "The front room, on the level you walk in at. Their room and bath are off it.",
    sources: [PHOTO_READ],
  },
  address: "28 Coatsbrae Avenue",
  neighbourhood: "Woburn",
  askingPrice: sourced(1_315_000, MOCK),
  ourEstimate: sourced(1_298_000, ESTIMATE),
  suite: "ground-floor",
  metrics: { beds: 5, baths: 3, kitchens: 1, lot: "42 x 120 ft" },
  form: "Back split, one level in",
  access: "No step at the front",
  note: "Listed three times since spring. Something keeps stopping it.",
  permit: "Ground-floor bed and bath",
  driveMinutes: 12,
  transitMinutes: 7,
  photos: ["/homes/coatsbrae.jpg", "/homes/bendale-living.jpg"],
  photoTint: "#DBDDD6",
  tag: { label: "Relisted twice", tone: "authority" },
};

export const ELLESMERE: Listing = {
  id: "ellesmere-40",
  summary: "Bendale bungalow with the suite at the back, two steps up.",
  proof: {
    photo: "/homes/morningside-kitchen.jpg",
    caption: "The suite's kitchen at the back, with its window on the garden.",
    sources: [CITY_RECORDS, PHOTO_READ],
  },
  address: "40 Ellesmere Road",
  neighbourhood: "Bendale",
  askingPrice: sourced(1_205_000, MOCK),
  ourEstimate: sourced(1_214_000, ESTIMATE),
  suite: "legal-suite",
  metrics: { beds: 4, baths: 3, kitchens: 2, lot: "43 x 118 ft" },
  form: "Bungalow, suite at back",
  access: "Two steps to the door",
  note: "New on Tuesday. Nobody has been through it yet.",
  permit: "Permit on file, 2022",
  driveMinutes: 7,
  transitMinutes: 3,
  photos: ["/homes/ellesmere.jpg", "/homes/morningside-kitchen.jpg"],
  photoTint: "#DEDBD5",
};

export const BRIMLEY: Listing = {
  id: "brimley-7",
  summary: "Cliffcrest side split. One level in, and a flat path to it.",
  proof: {
    photo: "/homes/galloway-living.jpg",
    caption: "Their room, on the level you walk in at. The bath is across the hall.",
    sources: [PHOTO_READ],
  },
  address: "7 Brimley Road South",
  neighbourhood: "Cliffcrest",
  askingPrice: sourced(1_142_000, MOCK),
  ourEstimate: sourced(1_155_000, ESTIMATE),
  suite: "ground-floor",
  metrics: { beds: 4, baths: 2, kitchens: 1, lot: "39 x 116 ft" },
  form: "Side split, one level in",
  access: "Flat path to the door",
  note: "New on Wednesday. The photographs are the agent's own.",
  permit: "Ground-floor bed and bath",
  driveMinutes: 15,
  transitMinutes: 2,
  photos: ["/homes/brimley.jpg", "/homes/galloway-living.jpg"],
  photoTint: "#D9DDE0",
};

export const KECALA: Listing = {
  id: "kecala-12",
  summary: "Bendale bungalow. The suite has its own door and four steps to it.",
  proof: {
    photo: "/homes/woburn-entrance.jpg",
    caption: "The suite's own door, from inside, and the stair down beside it.",
    sources: [CITY_RECORDS, PHOTO_READ],
  },
  address: "12 Kecala Road",
  neighbourhood: "Bendale",
  askingPrice: sourced(1_218_000, MOCK),
  ourEstimate: sourced(1_231_000, ESTIMATE),
  suite: "legal-suite",
  metrics: { beds: 4, baths: 3, kitchens: 2, lot: "38 x 124 ft" },
  form: "Suite has its own door",
  access: "Four steps to the door",
  note: "The suite has been rented to the same tenant for six years.",
  permit: "Permit on file, 2017",
  driveMinutes: 9,
  transitMinutes: 2,
  photos: ["/homes/kecala.jpg", "/homes/woburn-entrance.jpg"],
  photoTint: "#DFDDD7",
};

export const MARCOS: Listing = {
  id: "marcos-61",
  summary: "Bendale bungalow, all on one level, no step at the front.",
  proof: {
    photo: "/homes/morningside-living.jpg",
    caption: "The front room. One level from the door to their room and bath.",
    sources: [PHOTO_READ],
  },
  address: "61 Marcos Boulevard",
  neighbourhood: "Bendale",
  askingPrice: sourced(1_168_000, MOCK),
  ourEstimate: sourced(1_174_000, ESTIMATE),
  suite: "ground-floor",
  metrics: { beds: 4, baths: 2, kitchens: 1, lot: "46 x 118 ft" },
  form: "Bungalow, all one level",
  access: "No step at the front",
  note: "Nothing to climb anywhere in it, inside or out.",
  permit: "Ground-floor bed and bath",
  driveMinutes: 11,
  transitMinutes: 3,
  photos: ["/homes/marcos.jpg", "/homes/morningside-living.jpg"],
  photoTint: "#DDDFD9",
};

export const DANFORTH: Listing = {
  id: "danforth-88",
  summary: "Woburn side split. Their bedroom and bath are off the hall, no stairs.",
  proof: {
    // Not woburn-living.jpg: that frame is a split level with three steps in
    // it, and a caption saying "no stairs" over a photograph of stairs is
    // the one thing this block exists to prevent.
    photo: "/homes/bendale-living.jpg",
    caption: "The front room. Their room and bath are off it, no stairs.",
    sources: [PHOTO_READ],
  },
  address: "88 Danforth Road",
  neighbourhood: "Woburn",
  askingPrice: sourced(1_275_000, MOCK),
  ourEstimate: sourced(1_275_000, ESTIMATE),
  suite: "ground-floor",
  metrics: { beds: 4, baths: 2, kitchens: 1, lot: "38 x 118 ft" },
  form: "All on one level",
  access: "Five steps to the door",
  note: "Their room and bath are off the hall, not down a flight.",
  permit: "Ground-floor bed and bath",
  driveMinutes: 11,
  transitMinutes: 1,
  photos: [
    "/homes/woburn.jpg",
    "/homes/bendale-living.jpg",
    "/homes/woburn-kitchen.jpg",
    "/homes/woburn-entrance.jpg",
  ],
  photoTint: "#E2DED8",
};

/**
 * Every home, in the order a person would meet them.
 *
 * Screens filter this. No screen defines its own addresses, which is the rule
 * that stops the same house appearing twice at two prices.
 */
export const LISTINGS: readonly Listing[] = [
  BENDALE,
  BELLAMY,
  MORNINGSIDE,
  GALLOWAY,
  PAINTED_POST,
  PITFIELD,
  DANFORTH,
  FENWOOD,
  COATSBRAE,
  ELLESMERE,
  BRIMLEY,
  KECALA,
  MARCOS,
];

/**
 * How many homes in the area she drew, and in what shape.
 *
 * This is the only place the number eleven is written down. The advert's
 * sub-line, the map key and the link in the footer all read from here, because
 * the last time they did not, the headline promised eleven and the map drew
 * five. A claim that appears in three places and is stored in one cannot drift
 * out of agreement with itself.
 */
export const AREA_SHAPES = [
  { shape: "suite", count: 4, label: "with a suite" },
  { shape: "ground", count: 4, label: "ground floor" },
  { shape: "convert", count: 3, label: "could convert" },
] as const;

export const AREA_TOTAL = AREA_SHAPES.reduce((n, s) => n + s.count, 0);

/**
 * The three in the sponsored card: one of each shape.
 *
 * They deliberately are not all second-kitchen homes. The advert illustrates
 * the three shapes the assistant has just described; if it showed only suites,
 * her next message - "list houses with a second kitchen" - would narrow
 * nothing and the widget would be repeating the advert with addresses attached.
 */
export const AD_LISTINGS: readonly Listing[] = [BENDALE, DANFORTH, GALLOWAY];

/**
 * The three the widget can name, once she asks by name.
 *
 * All three have a second kitchen with a record at the city, which is what she
 * filtered for. The fourth match, 32 Pitfield Road, has the kitchen and no
 * record, and the assistant names it in prose rather than the widget showing it
 * as a card.
 */
export const WIDGET_LISTINGS: readonly Listing[] = [
  {
    ...BENDALE,
    // A second exterior of the same house, because the widget knows the
    // address and the advert only knows the neighbourhood.
    photos: ["/homes/ellendale.jpg", ...BENDALE.photos.slice(1)],
  },
  BELLAMY,
  MORNINGSIDE,
];

/**
 * The one the widget filtered out.
 *
 * It is a separate export because it is a separate idea: the exclusion panel
 * exists so the assistant cannot quietly drop a house that failed a test the
 * user set. Deleting this constant would delete the honesty, not a card.
 */
export const EXCLUDED = {
  address: "32 Pitfield Road",
  reason:
    "It has a separate entrance and a kitchen downstairs. There is no permit on record for either, so it is not the thing you asked for.",
  action: "Show it anyway",
} as const;

/**
 * @deprecated Use `DANFORTH`. Kept so nothing breaks mid-rename.
 */
export const WOBURN = DANFORTH;
/**
 * @deprecated Use `GALLOWAY`.
 */
export const HIGHLAND_CREEK = GALLOWAY;
