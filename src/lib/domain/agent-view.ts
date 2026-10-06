import {
  CAST,
  type Condition,
  type Message,
  type Paper,
  type SavedHome,
} from "@/data/saved";
import { agentKey, type SavedSession } from "./saved-session";

/**
 * Everything the agent can see about a home, and nothing else.
 *
 * The rule this file exists to keep is one sentence: *Anusha sees the homes
 * you put her on, the papers, and what you send her. Not your budget, not
 * your home, not what the family says.* That sentence is printed on the seat,
 * in the share menu and in the footer, and a promise printed three times is
 * worth exactly as much as the code behind it.
 *
 * So the projection is a function rather than a convention. A component
 * cannot show the agent a verdict chip or a ceiling figure by accident,
 * because the object handed to an agent-facing surface has no field for one.
 * `agent-view.test.ts` holds the fixture to it: every message in the view is
 * either hers or was sent to her by the person who wrote it, and nothing in
 * it is about money.
 *
 * Two things stay out that a reader might expect in.
 *
 *   The stage. *To view*, *Visited*, *Closing* is a tag Nirosha puts on a
 *   home for herself, and where a buyer thinks she is in her own head is not
 *   a fact an agent is owed. The conditions carry what an agent needs to
 *   know about an accepted offer, with a date and a name against each.
 *
 *   The record. What the market did is hers to read on this page, but half
 *   of it is what the family did - "You and Amma went to see it" - and
 *   splitting a list into the public half and the private half is the kind
 *   of rule that quietly stops holding. The whole list stays behind.
 *
 * There is no distress here and there never can be, which is the other half
 * of the same rule: `CLAUDE.md` forbids surfacing a distressed owner to an
 * agent, and the way to keep that is to have no field it could travel in.
 */

export interface AgentView {
  listingId: string;
  /** The lane she reads: her own posts, and what was sent to her. */
  messages: readonly Message[];
  /** What is on file and what is still owed. */
  papers: readonly Paper[];
  /** The conditions on an accepted offer. Empty until there is one. */
  conditions: readonly Condition[];
}

/**
 * Whether the agent has a seat on this home.
 *
 * Off unless Nirosha put her on it. A key in `session.seat` wins outright,
 * so taking her off a home the fixture had her on is a real change rather
 * than a request the view quietly ignores.
 */
export function agentOnFor(home: SavedHome, session: SavedSession): boolean {
  const set = session.seat[home.listingId];
  if (set !== undefined) return set;
  return home.agent === true;
}

/**
 * A message is sendable when it was not written by the agent, has not been
 * sent already, and is not about the budget.
 *
 * The budget rule is declared on the message, never read out of its words.
 * The product could find "$1,190,000" in a sentence; it could not know that
 * "the only one over the ceiling, and by $25,000" gives the same figure away
 * to anybody holding the asking price. So the fixture says which messages
 * those are, and this reads the declaration.
 */
export function isSendable(
  message: Message,
  home: SavedHome,
  session: SavedSession,
): boolean {
  if (CAST[message.from].tone === "agent") return false;
  if (message.about === "budget") return false;
  return !wasSent(message, home, session);
}

/** True once this message has gone to the agent, in the fixture or this session. */
export function wasSent(
  message: Message,
  home: SavedHome,
  session: SavedSession,
): boolean {
  return (session.forwarded[home.listingId] ?? []).includes(message.id);
}

/** Why a message cannot be sent, in her words. Empty when it can. */
export function whyNotSendable(message: Message): string {
  return message.about === "budget"
    ? "Not sendable. It has your line in it."
    : "";
}

/**
 * What the agent would see, built from the fixture and this session.
 *
 * Returns an empty lane rather than null when she has no seat, so a caller
 * that forgets to check the seat shows her nothing instead of everything.
 */
export function agentViewOf(
  home: SavedHome,
  session: SavedSession,
): AgentView {
  if (!agentOnFor(home, session)) {
    return { listingId: home.listingId, messages: [], papers: [], conditions: [] };
  }
  return {
    listingId: home.listingId,
    messages: [...home.withAgent, ...(session.replies[agentKey(home.listingId)] ?? [])],
    papers: home.papers,
    conditions: home.conditions ?? [],
  };
}

/** Every home the agent has a seat on. What "she is on six of your eleven" counts. */
export function homesWithAgent(
  homes: readonly SavedHome[],
  session: SavedSession,
): readonly SavedHome[] {
  return homes.filter((h) => agentOnFor(h, session));
}
