import { OPENING_QUESTION, SECOND_QUESTION, WIDGET_QUESTION } from "./conversation";

/**
 * What the widget filtered on, and the words that put each one there.
 *
 * The bar above the results says "Built from what you told me". That is a
 * claim, and a claim needs something behind it: every chip carries the clause
 * she actually typed, and a test fails the build if one of them stops being a
 * substring of anything she said. Without that, "from your chat" is a label a
 * lead form could wear.
 *
 * Each `said` is the whole clause rather than the four words that named the
 * thing, because the panel quotes it back as a sentence. "near transit and
 * the hospital" is a match; "she cooks every day and she doesn't drive, so it
 * has to be near transit and the hospital" is her reason, and the reason is
 * what she will recognise.
 *
 * The thresholds are hers too. Fifteen minutes and ten minutes are not our
 * idea of near; they are the numbers the cards are filtered against, which is
 * why they are stated once up here rather than printed on every card as a
 * badge saying "close to care".
 */

export interface DeclaredCriterion {
  id: string;
  /** How the chip reads. */
  label: string;
  /** The words she used, verbatim. The chip exists because of this and nothing else. */
  said: string;
}

/** Everything she typed, in the order she typed it. */
export const HER_WORDS: readonly string[] = [
  OPENING_QUESTION,
  SECOND_QUESTION,
  WIDGET_QUESTION,
];

export const DECLARED: readonly DeclaredCriterion[] = [
  {
    id: "second-kitchen",
    label: "A second kitchen with its own door",
    said: "does amma need her own kitchen? she cooks every day",
  },
  {
    id: "hospital",
    label: "Hospital under 15 min",
    said: "she cooks every day and she doesn't drive, so it has to be near transit and the hospital",
  },
  {
    id: "bus",
    label: "A bus within 10 min",
    said: "she doesn't drive, so it has to be near transit and the hospital",
  },
  {
    id: "temple",
    label: "A temple within reach",
    said: "it has to be near transit and the hospital, and the temple if we can",
  },
  {
    id: "where",
    label: "Scarborough",
    said: "list houses with a second kitchen near us in scarborough",
  },
  {
    id: "tamil",
    label: "An agent who speaks Tamil",
    said: "she has no english either so a tamil agent would help",
  },
];

/**
 * The one she has not answered, left visibly empty.
 *
 * The assistant closes by admitting it cannot price her semi, so a budget is
 * the only condition on this screen that nothing she said supports. Filling it
 * in for her would be the inference the rest of this product refuses; leaving
 * the slot open is what makes the handover to the next screen a continuation
 * rather than a fresh form.
 */
export const UNDECLARED = {
  label: "Add a budget",
  why: "You have not told me what your semi is worth, so I have not guessed at one.",
} as const;
