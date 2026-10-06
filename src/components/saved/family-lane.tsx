"use client";

import { AGENT, type Message, type SavedHome } from "@/data/saved";
import {
  agentOnFor,
  isSendable,
  wasSent,
  whyNotSendable,
} from "@/lib/domain/agent-view";
import { cn } from "@/lib/utils";
import { useSaved } from "./saved-provider";
import { SavedThread } from "./saved-thread";

/**
 * The family's lane on a home, and the one control that moves a sentence out
 * of it.
 *
 * Everything here is between the people who are going to live in the house.
 * Amma on where the smell from the kitchen goes, Rani arguing that a ramp is
 * nothing, Arun asking whether $1,185,000 is still inside the line. The last
 * of those is why the lane exists: the fixture had Arun naming the ceiling in
 * three threads that an agent was reading, and no amount of copy about
 * privacy survives that.
 *
 * Sending is per message and it is done by the person who wrote it, which is
 * the only version that is honest. Nirosha cannot hand Anusha her mother's
 * voice note as though it were her own question, and nobody has to opt the
 * whole conversation in to get one answer out of it.
 *
 * A message about the budget is not sendable, and the row says so instead of
 * hiding the control. Hiding it would leave her wondering which messages she
 * had missed; naming the reason teaches the rule in four words. The rule is
 * declared on the message rather than read out of its words - "over the
 * ceiling, and by $25,000" gives the figure away to anyone holding the
 * asking price, and no amount of string matching finds that.
 */
export function FamilyLane({ home }: { home: SavedHome }) {
  const { state, dispatch } = useSaved();
  const seated = agentOnFor(home, state);

  const sendRow = (message: Message) => {
    if (!seated) return null;
    const sent = wasSent(message, home, state);
    const can = isSendable(message, home, state);
    const why = whyNotSendable(message);

    if (sent) {
      return (
        <p className="pt-1.5 text-[12px]/[18px] text-ink-muted">
          Sent to {AGENT.name}.
        </p>
      );
    }
    if (!can) {
      // Her own words come back to her with no control at all; only a
      // refusal has something to explain.
      return why ? (
        <p className="flex flex-wrap items-center gap-x-2 pt-1.5 text-[12px]/[18px]">
          <span className="text-ink-faint line-through">
            Send to {AGENT.name}
          </span>
          <span className="text-ink-muted">{why}</span>
        </p>
      ) : null;
    }
    return (
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "forward",
            listingId: home.listingId,
            messageId: message.id,
            from: message.from,
            text: message.text,
            ...(message.voice ? { voice: message.voice } : {}),
          })
        }
        className={cn(
          "mt-1.5 rounded-sm text-[12px]/[18px] font-medium text-action-deep underline underline-offset-2 outline-none ease-out hover:text-ink",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action motion-safe:transition-colors motion-safe:duration-150",
        )}
      >
        Send to {AGENT.name}
      </button>
    );
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl bg-sunken px-4 py-4">
      <div className="flex flex-col gap-0.5">
        <p className="font-mono text-[11px] tracking-[0.1em] text-ink-muted uppercase">
          Family
        </p>
        <p className="text-[12px]/[18px] text-ink-muted">
          {seated
            ? `${AGENT.name} does not see this.`
            : "Only the people you shared this with."}
        </p>
      </div>

      <SavedThread
        on={home.listingId}
        fixture={home.thread}
        placeholder="Write to the family"
        under={sendRow}
        quiet="Nobody has said anything about this one yet."
      />
    </section>
  );
}
