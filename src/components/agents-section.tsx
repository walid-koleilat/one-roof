"use client";

import { useState } from "react";
import { AgentRecord } from "@/components/agent-record";
import { MatterRow } from "@/components/matter-row";
import { AGENTS, type Agent } from "@/data/agents";
import {
  agentMattersFor,
  agentsInOrder,
  type DeclaredLanguage,
} from "@/lib/domain/matters";
import { cn } from "@/lib/utils";

/** How many of the pool a screen shows. The heading says three, so three. */
const SHOWN = 3;

/**
 * Three agents, and the number that makes the others believable.
 *
 * A house and an agent are the same component: photo, the name she would say
 * out loud, one plain sentence, WHAT MATTERS TO YOU as a list that can fail,
 * and the raw number demoted to last beside its sample size. Every agent here
 * fails one of her rows in the same size type as the rows they pass, because
 * a directory that only flatters is an advertisement.
 *
 * A card opens the record behind it, in place, and that is all it does.
 * Nobody has been matched to her and nobody has been told about her; the
 * nudge's receipt says so, and the only line under the heading explains the
 * order of the cards. There is no contact path, on purpose: the one rule
 * this product will not bend is that an owner is never handed to an agent.
 */
export function AgentsSection({
  declared,
}: {
  /** The language she asked for, if she asked. Null on the cold arrival. */
  declared: DeclaredLanguage | null;
}) {
  const asked = declared ?? undefined;
  const [open, setOpen] = useState<Agent | null>(null);
  return (
    <section className="px-4 pt-[52px] pb-2 sm:px-6">
      {open ? (
        <AgentRecord agent={open} declared={asked} onClose={() => setOpen(null)} />
      ) : null}
      <div className="mx-auto flex w-full max-w-[1328px] flex-col gap-5">
        <header className="flex max-w-[900px] flex-col gap-1.5">
          <h2 className="text-[22px]/[30px] font-bold tracking-[-0.02em] text-ink sm:text-[28px]/[36px]">
            Three agents who have actually bought a house with a suite in it
          </h2>
          {asked ? (
            <p className="text-sm/6 text-ink-muted sm:text-[15px]/6">
              {asked.language} first, because you asked for that.
            </p>
          ) : null}
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-[25px]">
          {agentsInOrder(AGENTS, asked).slice(0, SHOWN).map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              declared={asked}
              onOpen={() => setOpen(agent)}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

function AgentCard({
  agent,
  declared,
  onOpen,
}: {
  agent: Agent;
  declared?: DeclaredLanguage;
  onOpen: () => void;
}) {
  const rows = agentMattersFor(agent, declared);
  return (
    <article className="relative flex flex-col overflow-hidden rounded-xl border border-hairline-strong bg-background transition-shadow hover:shadow-[0_6px_20px_rgba(22,24,26,0.10)]">
      <span
        role="img"
        aria-label={`${agent.name}, outside a house in Scarborough`}
        className="h-[206px] shrink-0 bg-cover bg-[position:50%_30%]"
        style={{ backgroundImage: `url(${agent.photo})` }}
      />
      <div className="flex grow flex-col gap-2 px-5 py-[18px]">
        {/* The name is the button, stretched over the whole card, so any press opens the record. */}
        <p className="text-[17px]/[25px] font-semibold text-ink">
          <button
            type="button"
            onClick={onOpen}
            className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
          >
            {agent.name}
          </button>
        </p>
        {/*
          Languages lead the sentence only when a language was asked for. On
          the cold arrival nobody said which one, so the credential is not
          offered as an answer to a question nobody put.
        */}
        <p className="min-h-[44px] text-sm/[22px] text-ink-body">
          {declared ? `${agent.languages}. ${agent.note}` : agent.note}
        </p>

        <p className="pt-0.5 font-mono text-[10px]/3 font-medium tracking-[0.09em] text-ink-muted uppercase">
          {declared ? "What matters to you" : "What the record says"}
        </p>

        {declared ? (
          <ul className="flex flex-col gap-2">
            {rows.map((m) => (
              <MatterRow key={m.label} matter={m} valueAt="end" size="md" />
            ))}
          </ul>
        ) : (
          <dl className="flex flex-col gap-2">
            {rows.map((m) => (
              <div key={m.label} className="flex items-center justify-between gap-2">
                <dt className="text-sm/[21px] text-ink">{m.label}</dt>
                <dd className="text-sm/[21px] font-semibold text-ink">{m.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <span aria-hidden className="mt-1.5 mb-0.5 border-t border-hairline" />

        <p className="flex items-center gap-2">
          <svg width="14" height="13" viewBox="0 0 14 13" aria-hidden>
            <path
              d="M7 0.8L8.9 4.6L13 5.2L10 8.1L10.7 12.2L7 10.3L3.3 12.2L4 8.1L1 5.2L5.1 4.6L7 0.8Z"
              fill="var(--ds-ink)"
            />
          </svg>
          <span className="text-sm/[21px] font-semibold text-ink">
            {agent.rating.toFixed(1)}
          </span>
          <span className={cn("text-[13px]/[21px] text-ink-muted")}>
            from {agent.reviews} reviews
          </span>
          <span className="ml-auto text-[13px]/[21px] font-medium text-ink underline underline-offset-2">
            See the record
          </span>
        </p>
      </div>
    </article>
  );
}
