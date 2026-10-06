/**
 * The three agents the widget can show, and the one number that makes the
 * other numbers believable.
 *
 * `buyerSideInTen` is the honest field. Kayal has done five times as many
 * homes with a suite as anyone else here and represents the buyer three times
 * in ten, which means most of what he knows he learned while working for the
 * other side. Both facts sit on the card in the same size type.
 *
 * A directory that only flatters is an advertisement. The number that makes
 * her hesitate is what proves the rest were not chosen to impress her.
 *
 * `reviews` is shown beside `rating` for the same reason. A 4.8 from eleven
 * people and a 4.6 from ninety-six are not the same claim, and a score with
 * its sample size hidden is the oldest trick in a directory.
 */
/**
 * The record behind the card, opened in place. Every line is a fact the
 * directory can stand behind, and the band is the cheapest and dearest suite
 * they closed rather than a range somebody wrote. Invented like the rest of
 * the data here, and typed so a reviewer can see what each sheet claims.
 */
export interface AgentRecord {
  brokerage: string;
  /** First year licensed. */
  since: number;
  /** Where most of their closes are. */
  area: string;
  /** The cheapest and dearest home with a suite they have closed. */
  suiteBand: { low: number; high: number };
  /** The last three homes with a suite: street, month, and which side they acted for. */
  recent: readonly {
    street: string;
    when: string;
    side: "buyer" | "seller";
  }[];
}

export interface Agent {
  id: string;
  name: string;
  languages: string;
  /** Homes with a second suite this agent has actually closed. */
  suites: number;
  /** Out of ten transactions, how many were on the buyer's side. */
  buyerSideInTen: number;
  /** Mean score out of five, from clients who closed with them. */
  rating: number;
  /** How many of those there are. A 5.0 from two people is not a 5.0. */
  reviews: number;
  note: string;
  photo: string;
  record: AgentRecord;
}

/**
 * Six agents, of which any screen shows three.
 *
 * Every name, face, brokerage and number here is invented. A real firm's name
 * beside a record that does not exist would claim something about that firm,
 * which is the same reason none of the agents is a real person.
 *
 * The three who speak Tamil are listed first so that, when she has asked for
 * that, they lead in the order the data gives them. On the cold arrival
 * nobody said which language, so the order is the record and the faces
 * change: a set picked by a language nobody declared would be the one
 * inference this product does not make.
 */
export const AGENTS: readonly Agent[] = [
  {
    id: "anusha",
    name: "Anusha Rajaratnam",
    languages: "Tamil and English",
    suites: 9,
    buyerSideInTen: 7,
    rating: 4.9,
    reviews: 38,
    note: "Has pulled a permit record mid-offer.",
    photo: "/agents/anusha.jpg",
    record: {
      brokerage: "Brimley Point Realty",
      since: 2014,
      area: "Bendale and Woburn",
      suiteBand: { low: 1_085_000, high: 1_410_000 },
      recent: [
        { street: "Ellesmere Road", when: "June", side: "buyer" },
        { street: "Brimley Road South", when: "March", side: "buyer" },
        { street: "Lawrence Avenue East", when: "January", side: "seller" },
      ],
    },
  },
  {
    id: "thivya",
    name: "Thivya Selvam",
    languages: "Tamil, Sinhala and English",
    suites: 4,
    buyerSideInTen: 9,
    rating: 4.8,
    reviews: 11,
    note: "Newest of the three.",
    photo: "/agents/thivya.jpg",
    record: {
      brokerage: "Kecala Park Realty",
      since: 2021,
      area: "Agincourt and Bendale",
      suiteBand: { low: 1_040_000, high: 1_260_000 },
      recent: [
        { street: "Kecala Road", when: "July", side: "buyer" },
        { street: "Marcos Boulevard", when: "April", side: "buyer" },
        { street: "Painted Post Drive", when: "February", side: "buyer" },
      ],
    },
  },
  {
    id: "kayal",
    name: "Kayal Ponnusamy",
    languages: "Tamil and English",
    suites: 21,
    buyerSideInTen: 3,
    rating: 4.6,
    reviews: 96,
    note: "Twenty years in Scarborough, most of it in Woburn.",
    photo: "/agents/kayal.jpg",
    record: {
      brokerage: "Ellesmere Gate Realty",
      since: 2005,
      area: "Woburn",
      suiteBand: { low: 990_000, high: 1_620_000 },
      recent: [
        { street: "Bellamy Road North", when: "August", side: "seller" },
        { street: "Galloway Road", when: "June", side: "seller" },
        { street: "Morningside Avenue", when: "May", side: "buyer" },
      ],
    },
  },
  {
    id: "wendy",
    name: "Wendy Chau",
    languages: "Cantonese, Mandarin and English",
    suites: 26,
    buyerSideInTen: 6,
    rating: 4.7,
    reviews: 142,
    note: "Half of what she closes has a suite in the basement.",
    photo: "/agents/wendy.jpg",
    record: {
      brokerage: "Painted Post Realty",
      since: 2008,
      area: "Agincourt and Milliken",
      suiteBand: { low: 1_010_000, high: 1_580_000 },
      recent: [
        { street: "Glen Watford Drive", when: "August", side: "buyer" },
        { street: "Huntingwood Drive", when: "July", side: "seller" },
        { street: "Sheppard Avenue East", when: "May", side: "buyer" },
      ],
    },
  },
  {
    id: "daniel",
    name: "Daniel Okafor",
    languages: "English and Igbo",
    suites: 14,
    buyerSideInTen: 8,
    rating: 4.9,
    reviews: 27,
    note: "Reads the permit history before the showing, not after.",
    photo: "/agents/daniel.jpg",
    record: {
      brokerage: "Bellamy Ridge Realty",
      since: 2016,
      area: "Bendale and Dorset Park",
      suiteBand: { low: 1_060_000, high: 1_390_000 },
      recent: [
        { street: "Midland Avenue", when: "August", side: "buyer" },
        { street: "Dorset Road", when: "June", side: "buyer" },
        { street: "Antrim Crescent", when: "March", side: "buyer" },
      ],
    },
  },
  {
    id: "rosa",
    name: "Rosa Mendoza",
    languages: "Tagalog, Spanish and English",
    suites: 6,
    buyerSideInTen: 7,
    rating: 4.7,
    reviews: 19,
    note: "Most of her buyers are two households under one roof.",
    photo: "/agents/rosa.jpg",
    record: {
      brokerage: "Galloway Lane Realty",
      since: 2019,
      area: "Cliffcrest and Scarborough Village",
      suiteBand: { low: 985_000, high: 1_240_000 },
      recent: [
        { street: "Kingston Road", when: "July", side: "buyer" },
        { street: "Cliffside Drive", when: "May", side: "seller" },
        { street: "Markham Road", when: "February", side: "buyer" },
      ],
    },
  },
];
