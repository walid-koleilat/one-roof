/**
 * The J1 conversation, as a transcript rather than as markup.
 *
 * It lives here so the thing a reviewer has to check - does the assistant ever
 * hand over listing data before being asked by name - can be read straight
 * through without opening a component.
 *
 * She does not arrive asking about permits or second units. She asks the
 * question a person actually asks, which is how big a house has to be for five
 * people who used to be two households, and whether her parents need their own
 * kitchen. The vocabulary the industry uses turns up later, once it is the
 * answer to something.
 *
 * One line is load-bearing and should not be softened:
 *
 *   "she has no english either so a tamil agent would help"
 *      Everything downstream about language - the Tamil agent filter on J2,
 *      Appa's transcribed voice notes on J4 - is sourced to this line. She
 *      declared it. Nothing was inferred from a name or a postal code.
 */

export const OPENING_QUESTION =
  "my appa fell in march and my parents are moving in with us. what kind of house do we actually need, and how big does it have to be for five of us? we would be selling our semi in scarborough";

export const FIRST_REPLY = [
  "For five people in what are really two households, plan on 2,200 to 2,600 square feet. Under 2,000 and somebody is always standing in somebody else's kitchen.",
  "Your parents need a bedroom, a full bathroom and somewhere to sit that is theirs. That is about 600 square feet of it, and after a fall it wants to be on the ground floor rather than down a flight of stairs.",
  "The rest is yours. Three bedrooms and a bathroom you are not sharing with them.",
] as const;

export const SECOND_QUESTION =
  "does amma need her own kitchen? she cooks every day and she doesn't drive, so it has to be near transit and the hospital, and the temple if we can. she has no english either so a tamil agent would help";

export const LEGAL_REPLY = [
  "If she cooks every day, yes. Two people sharing one kitchen at the same times each day is the thing that goes wrong first, and it is expensive to fix later.",
  "A second kitchen with its own door is called a suite. When the city has a record of it, somebody has checked the fire separation and the exit window. When there is no record, nobody has, and that is the part that matters when the person sleeping down there fell in March.",
] as const;

export const BILL_23_SOURCES = [
  "One Roof · What a second suite has to have",
  "+2",
] as const;

export const SHAPES_LEAD =
  "So there are three shapes that work, and they are not priced the same:";

export const SHAPES = [
  "A suite that is already there. Its own kitchen, its own door, and the city has inspected it. Fewest of these, and they cost the most.",
  "A bedroom and bathroom on the ground floor. No second kitchen, but no stairs either, which matters more after a fall than most people expect.",
  "A basement that could become one later. Ceiling height and window size decide it, not how finished it looks. Most fail on the height, and yours is 6 ft 4 in.",
] as const;

export const MORTGAGE_REPLY = [
  "The record is worth having for one reason. A permit means somebody from the city looked at the fire separation between the two units, and at whether the bedroom downstairs has a window big enough to climb out of. Without one, nobody has checked either.",
  "Put transit, the hospital and the temple on the map rather than in your head. Eleven minutes to Scarborough General is a different house from twenty-five when your mother does not drive, and it is not something you can tell from a listing photograph.",
] as const;

export const MORTGAGE_SOURCES = [
  "Ontario Building Code · Part 9",
  "City of Toronto · permit records",
] as const;

export const WIDGET_ANSWER = [
  "Four of the eleven have a second kitchen with its own door. Three of those four have a record at the city, and those three are below.",
  "Three agents in Scarborough speak Tamil. Their records are underneath, including the one who mostly acts for sellers, because that is worth knowing before you call anybody.",
] as const;

export const BLIND_SPOT = [
  "What I cannot tell you is what your semi is worth today. Until you have that number, every house I show you is a guess.",
] as const;

export const AD_DISCLAIMER = [
  "Ads do not influence the answers you get from ChatGPT. Your chats stay private.",
  "Learn about ads and personalization >",
] as const;

export const WIDGET_QUESTION =
  "@One Roof list houses with a second kitchen near us in scarborough, and show me some agents who speak tamil";

export const CLOSING_REPLY = [
  "The fourth is 32 Pitfield Road. It has a separate entrance and a kitchen downstairs, but the city has no record of either, so nothing about that space has been checked and the city could close it.",
  "Say the word and I will show it anyway. It is the cheapest of the four and ten minutes to the hospital, and plenty of people bring one up to code.",
  "The one thing I still cannot tell you is what your semi is worth, and that is what decides which of these four you can actually reach. One Roof will do that part without asking you to talk to anyone.",
] as const;

/**
 * The conversation as an ordered script, so it can be played rather than
 * printed.
 *
 * J1's argument is about a sequence: she describes a problem, the assistant
 * answers it, an advert appears that could not have named a house, she asks
 * One Roof by name, and only then do addresses arrive. Printing all of that
 * at once turns a sequence into a poster. Playing it back one turn at a time
 * is what makes the order legible, and the order is the point.
 *
 * The script is data rather than JSX so the whole conversation can still be
 * read top to bottom by somebody checking what the assistant is allowed to say.
 */
export type Step =
  /** She types. The composer fills, then sends. */
  | { kind: "ask"; text: string }
  /** The assistant answers. One or more paragraphs, revealed together. */
  | { kind: "say"; paragraphs: readonly string[] }
  | { kind: "list"; lead: string; items: readonly string[] }
  | { kind: "sources"; sources: readonly string[] }
  /** The sponsored card, which may not name a house. */
  | { kind: "ad" }
  /** The app widget, which may, because she asked for it by name. */
  | { kind: "widget" };

export const SCRIPT: readonly Step[] = [
  { kind: "ask", text: OPENING_QUESTION },
  { kind: "say", paragraphs: FIRST_REPLY },
  { kind: "ask", text: SECOND_QUESTION },
  { kind: "say", paragraphs: LEGAL_REPLY },
  { kind: "sources", sources: BILL_23_SOURCES },
  { kind: "list", lead: SHAPES_LEAD, items: SHAPES },
  { kind: "say", paragraphs: MORTGAGE_REPLY },
  { kind: "sources", sources: MORTGAGE_SOURCES },
  { kind: "say", paragraphs: BLIND_SPOT },
  { kind: "ad" },
  { kind: "ask", text: WIDGET_QUESTION },
  { kind: "say", paragraphs: WIDGET_ANSWER },
  { kind: "widget" },
  { kind: "say", paragraphs: CLOSING_REPLY },
];
