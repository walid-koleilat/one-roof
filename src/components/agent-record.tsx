"use client";

import { useEffect, useRef } from "react";
import { MatterRow } from "@/components/matter-row";
import type { Agent } from "@/data/agents";
import { formatCurrency } from "@/lib/domain/format";
import { agentMattersFor, type DeclaredLanguage } from "@/lib/domain/matters";

/**
 * The record behind an agent card, opened in place.
 *
 * It is what a directory owes her before she picks up the phone: the suites
 * this person has actually closed and the band those sold in, which side
 * they acted for, the last three streets, the languages, and the score with
 * its sample size beside it. The number that makes her hesitate is in the
 * same type as the rest, because a record that only flatters is an
 * advertisement.
 *
 * There is no phone number, no form and no message. The one rule this
 * product will not bend is that an owner is never handed to an agent, and
 * the last line of the sheet says so rather than leaving her to wonder.
 */
export function AgentRecord({
  agent,
  declared,
  onClose,
}: {
  agent: Agent;
  declared?: DeclaredLanguage;
  onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const { record } = agent;
  const rows = agentMattersFor(agent, declared);
  const sellers = agent.buyerSideInTen < 5;

  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    function away(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) onClose();
    }
    document.addEventListener("keydown", key);
    document.addEventListener("mousedown", away);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("mousedown", away);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${agent.name}, the record`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6"
    >
      <div
        ref={box}
        // The whole sheet fits the window: its height is the window less the
        // frame around it, the photograph and the last line hold their
        // place, and only the middle scrolls.
        className="flex max-h-dvh w-full flex-col overflow-hidden bg-background sm:max-h-[calc(100dvh-3rem)] sm:max-w-[560px] sm:rounded-[24px] sm:border sm:border-hairline-strong sm:shadow-[0_16px_44px_rgba(22,24,26,0.16)]"
      >
        <div className="relative shrink-0">
          <span
            role="img"
            aria-label={`${agent.name}, outside a house in Scarborough`}
            className="block h-36 bg-cover bg-[position:50%_30%] sm:h-44"
            style={{ backgroundImage: `url(${agent.photo})` }}
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-background text-ink shadow-[0_1px_3px_rgba(22,24,26,0.25)]"
          >
            <svg width="12" height="12" viewBox="0 0 11 11" fill="none" aria-hidden>
              <path d="M1 1L10 10M10 1L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="sr-only">Close the record</span>
          </button>
        </div>

        <div className="flex min-h-0 flex-col gap-5 overflow-y-auto px-6 pt-5 pb-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-[22px]/[30px] font-semibold tracking-[-0.01em] text-ink">
              {agent.name}
            </h2>
            <p className="text-sm/[22px] text-ink-body">
              {record.brokerage} · licensed since {record.since} · mostly in{" "}
              {record.area}
            </p>
            <p className="text-sm/[22px] text-ink-body">{agent.languages}.</p>
          </div>

          <dl className="grid grid-cols-3 gap-3 border-y border-hairline py-4">
            <Figure value={String(agent.suites)} label="homes with a suite closed" />
            <Figure
              value={`${agent.buyerSideInTen} in 10`}
              label="on the buyer's side"
            />
            <Figure
              value={agent.rating.toFixed(1)}
              label={`from ${agent.reviews} reviews`}
            />
          </dl>

          {sellers ? (
            <p className="rounded-lg bg-warm-tint px-4 py-3 text-sm/[22px] text-ink-body">
              Mostly acts for sellers. Most of what they know about a suite,
              they learned while working for the other side. Worth knowing
              before you call.
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px]/3 font-medium tracking-[0.09em] text-ink-muted uppercase">
              {declared ? "What matters to you" : "What the record says"}
            </p>
            <ul className="flex flex-col gap-2">
              {rows.map((m) => (
                <MatterRow key={m.label} matter={m} valueAt="end" size="md" />
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px]/3 font-medium tracking-[0.09em] text-ink-muted uppercase">
              The suites they closed
            </p>
            <p className="text-sm/[22px] text-ink-body">
              From {formatCurrency(record.suiteBand.low)} to{" "}
              {formatCurrency(record.suiteBand.high)}. The last three:
            </p>
            <ul className="flex flex-col">
              {record.recent.map((close) => (
                <li
                  key={close.street}
                  className="flex items-baseline justify-between gap-4 border-b border-hairline py-2 last:border-b-0"
                >
                  <span className="text-sm/5 text-ink">{close.street}</span>
                  <span className="shrink-0 text-[13px]/5 text-ink-muted">
                    {close.when} · {close.side === "buyer" ? "for the buyer" : "for the seller"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <p className="shrink-0 border-t border-hairline px-6 py-4 text-[13px]/5 text-ink-muted">
          Nobody is told you looked, and nobody has been matched to you. If
          you call, it is because you chose to.
        </p>
      </div>
    </div>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dd className="text-[20px]/[26px] font-semibold text-ink">{value}</dd>
      <dt className="text-[12px]/4 text-ink-muted">{label}</dt>
    </div>
  );
}
