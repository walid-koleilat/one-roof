/**
 * The guided route through the prototype, in order.
 *
 * A visitor has a few minutes and three screens. Left alone they will open one,
 * scroll it, and never find the thing it was built to prove - so each stop
 * carries one sentence naming the thing to press. Not a description of the
 * screen: an instruction, because the argument on every screen is something
 * that only happens when you touch it.
 *
 * The tour is a query parameter rather than a mode, so every stop is a link
 * somebody can send, and leaving it is closing a bar rather than logging out.
 */

export interface Stop {
  href: string;
  /** What this screen is, in three or four words. */
  name: string;
  /** The one thing to do here. Written as an instruction. */
  look: string;
}

export const TOUR: readonly Stop[] = [
  {
    href: "/my-parents-are-moving-in",
    name: "The conversation",
    look: "Watch the advert arrive on its own. It is not allowed to name a house. The one below it is, because she asked for it by name.",
  },
  {
    href: "/homes-with-a-suite",
    name: "Where she lands",
    look: "Every field arrived filled. Press the chat pill and change a clause; the number moves while the panel is still open.",
  },
  {
    href: "/the-ones-we-saved",
    name: "What she kept",
    look: "Open 64 Ellendale. The family's lane is one box and the agent's is the other, and Arun's question about the budget says it cannot be sent. Turn the agent off and her whole lane goes with her.",
  },
];

export const TOUR_PARAM = "tour";
