"use client";

import { AGENT, type SavedHome } from "@/data/saved";
import { agentOnFor } from "@/lib/domain/agent-view";
import { cn } from "@/lib/utils";
import { useSaved } from "./saved-provider";
import { Face } from "./share-menu";

/**
 * Whether the agent is on this house, and the sentence that says what that
 * means.
 *
 * One switch, one home. Not a switch on a collection and not a setting on
 * the account, because those would both be the same promise made about houses
 * she has not looked at yet. She puts Anusha on 64 Ellendale when there is
 * an offer to write, and 18 Bellamy stays between her and her mother.
 *
 * The sentence under it is the same sentence in the share menu and in the
 * footer, word for word. It is printed here because this is where the
 * decision is made, and a boundary explained anywhere except at the control
 * that moves it is a boundary explained too late. `agentViewOf` is what
 * makes it true; this only says it.
 */
export const AGENT_BOUNDARY = `${AGENT.name} sees the homes you put her on, the papers, and what you send her. Not your budget, not your home, not what the family says.`;

export function AgentSeat({ home }: { home: SavedHome }) {
  const { state, dispatch } = useSaved();
  const on = agentOnFor(home, state);

  return (
    <section
      className={cn(
        "flex flex-col gap-2 rounded-xl px-4 py-3.5 ease-out motion-safe:transition-colors motion-safe:duration-150",
        on ? "bg-action-tint" : "bg-sunken",
      )}
    >
      <div className="flex items-center gap-2.5">
        <Face person={AGENT.id} />
        <span className="flex min-w-0 grow flex-col">
          <span className="text-[14px]/[20px] font-semibold text-ink">
            {on
              ? `${AGENT.name} is on this one`
              : `${AGENT.name} is not on this one`}
          </span>
          <span className="text-[12px]/[18px] text-ink-muted">
            {AGENT.fullName ?? AGENT.name}
            {AGENT.role ? ` · ${AGENT.role}` : ""}
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={`${AGENT.name} on ${home.listingId}`}
          onClick={() =>
            dispatch({ type: "setAgent", listingId: home.listingId, on: !on })
          }
          className={cn(
            "relative h-6 w-[42px] shrink-0 rounded-full ease-out outline-none motion-safe:transition-colors motion-safe:duration-150",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action",
            on ? "bg-action" : "bg-hairline-strong",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "absolute top-[3px] size-[18px] rounded-full bg-background shadow-[0_1px_2px_rgba(22,24,26,0.3)] ease-out motion-safe:transition-[left] motion-safe:duration-150",
              on ? "left-[21px]" : "left-[3px]",
            )}
          />
        </button>
      </div>
      <p className="text-[12px]/[18px] text-ink-muted">{AGENT_BOUNDARY}</p>
    </section>
  );
}
