"use client";

import { AGENT, CAST, type Paper, type SavedHome } from "@/data/saved";
import { spelled } from "@/lib/domain/format";
import { agentKey } from "@/lib/domain/saved-session";
import { cn } from "@/lib/utils";
import { useSaved } from "./saved-provider";
import { SavedThread } from "./saved-thread";

/**
 * The lane the agent reads: the conditions, the papers, and the questions
 * that were put to her.
 *
 * It is the second of two lanes on a home and it is deliberately the one
 * with the paperwork in it. An agent is worth having on a house for three
 * things - she can get a permit print out of the city, she can hold a
 * deposit, she can tell you a rail bolts to brick - and none of them require
 * her to know what the family thinks or what the family can spend.
 *
 * The family reads this lane too. That is the asymmetry the page is built
 * on and it is stated at the top of the lane rather than left to be worked
 * out: everything here is visible to everybody, and the other lane is not.
 */

/**
 * "Three conditions, one cleared." The count opens on a word, and the
 * finished case is stated rather than counted, because "three of three
 * cleared" is arithmetic where a sentence will do.
 */
function conditionsLine(total: number, done: number): string {
  const conditions = `${capitalise(spelled(total))} ${total === 1 ? "condition" : "conditions"}`;
  if (done === total) return `${conditions}, all cleared`;
  if (done === 0) return `${conditions}, none cleared yet`;
  return `${conditions}, ${spelled(done)} cleared`;
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** A condition is either done, waiting, or somebody's job that has not started. */
function ConditionRow({
  what,
  by,
  holder,
  done,
  onToggle,
  fixed,
}: {
  what: string;
  by: string;
  holder: string;
  done: boolean;
  onToggle: () => void;
  /** The fixture wrote it done. There is no record to untick it into. */
  fixed: boolean;
}) {
  const Row = fixed ? "div" : "button";
  return (
    <Row
      {...(fixed ? {} : { type: "button" as const, onClick: onToggle })}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg py-1.5 text-left outline-none",
        !fixed &&
          "ease-out hover:bg-background/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action motion-safe:transition-colors motion-safe:duration-150",
      )}
    >
      <span aria-hidden className="flex size-4 shrink-0 items-center justify-center">
        {done ? (
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="7" fill="var(--ds-action)" />
            <path
              d="M4.6 8.2 L6.9 10.5 L11.4 5.9"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle
              cx="8"
              cy="8"
              r="6.4"
              fill="none"
              stroke="var(--ds-hairline-strong)"
              strokeWidth="1.4"
            />
          </svg>
        )}
      </span>
      <span
        className={cn(
          "min-w-0 grow text-[13px]/[19px]",
          done ? "text-ink-muted" : "text-ink",
        )}
      >
        {what}
        <span className="sr-only">{done ? ", cleared" : ", not yet"}</span>
      </span>
      {/* The holder is stored as it reads inside a sentence - "you and Arun"
          - because that is where "Next" reads it. A column starts one. */}
      <span className="w-[96px] shrink-0 truncate text-[12px]/[18px] text-ink-muted">
        {capitalise(holder)}
      </span>
      <span
        className={cn(
          "w-[104px] shrink-0 text-right text-[12px]/[18px] font-semibold",
          done ? "text-ink-muted" : "text-ink",
        )}
      >
        {by}
      </span>
    </Row>
  );
}

function PaperRow({ paper }: { paper: Paper }) {
  const filed = paper.state === "on-file";
  return (
    <li className="flex items-center gap-2.5 py-1">
      <span aria-hidden className="flex size-4 shrink-0 items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 16 16">
          <path
            d="M4 2.2 H9.4 L12.4 5.2 V13.4 A0.6 0.6 0 0 1 11.8 14 H4 A0.6 0.6 0 0 1 3.4 13.4 V2.8 A0.6 0.6 0 0 1 4 2.2 Z"
            fill="none"
            stroke={filed ? "var(--ds-action-deep)" : "var(--ds-ink-faint)"}
            strokeWidth="1.3"
            strokeDasharray={filed ? undefined : "2.2 2"}
          />
          <path
            d="M9.3 2.4 V5.4 H12.3"
            fill="none"
            stroke={filed ? "var(--ds-action-deep)" : "var(--ds-ink-faint)"}
            strokeWidth="1.3"
          />
        </svg>
      </span>
      <span className="min-w-0 grow text-[13px]/[19px] text-ink">
        {paper.what}
      </span>
      <span className="shrink-0 text-[12px]/[18px] text-ink-muted">
        {filed
          ? `${CAST[paper.from].name} · ${paper.when}`
          : `due ${paper.due}`}
      </span>
    </li>
  );
}

export function AgentLane({ home }: { home: SavedHome }) {
  const { state, dispatch } = useSaved();
  const id = home.listingId;
  const cleared = state.conditionsDone[id] ?? [];
  const conditions = home.conditions ?? [];
  const papers = home.papers;
  const open = conditions.filter(
    (c) => !c.done && !cleared.includes(c.id),
  ).length;

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-action-tint/60 px-4 py-4">
      <div className="flex flex-col gap-0.5">
        <p className="font-mono text-[11px] tracking-[0.1em] text-action-deep uppercase">
          With {AGENT.name}
        </p>
        <p className="text-[12px]/[18px] text-ink-muted">
          She reads this. The family sees it too.
        </p>
      </div>

      {conditions.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-[14px]/[20px] font-semibold text-ink">
            {conditionsLine(conditions.length, conditions.length - open)}
          </p>
          <ul className="flex flex-col">
            {conditions.map((condition) => {
              const done = Boolean(condition.done) || cleared.includes(condition.id);
              return (
                <li key={condition.id}>
                  <ConditionRow
                    what={condition.what}
                    by={condition.by}
                    holder={condition.holder ?? CAST[condition.who].name}
                    done={done}
                    fixed={Boolean(condition.done)}
                    onToggle={() =>
                      dispatch({
                        type: "tickCondition",
                        listingId: id,
                        conditionId: condition.id,
                      })
                    }
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {papers.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[11px] tracking-[0.1em] text-ink-muted uppercase">
            On file
          </p>
          <ul className="flex flex-col">
            {papers.map((paper) => (
              <PaperRow key={paper.id} paper={paper} />
            ))}
          </ul>
        </div>
      ) : null}

      <SavedThread
        on={agentKey(id)}
        fixture={home.withAgent}
        placeholder={`Ask ${AGENT.name}`}
        quiet={`Nothing has been asked yet. What you send her, and what she answers, sits here.`}
      />
    </section>
  );
}
