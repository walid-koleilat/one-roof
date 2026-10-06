"use client";

import { useEffect, useRef, useState } from "react";
import { CONTEXT_DATE, SENTENCES } from "@/data/context";
import { cn } from "@/lib/utils";

/**
 * The one place the page asks for an account without being asked first.
 *
 * It exists in exactly one of the four states: she arrived from the chat, and
 * she has no account. With no context there is nothing to lose, and signed in
 * there is nothing to warn about, so in the other three it does not render at
 * all rather than render quieter.
 *
 * It says what happened and what it costs: the page was set up from her
 * conversation, and without an account that lasts until the tab closes. Both
 * are facts she can check. "Never lose your search again" is a promise about
 * how she will feel, and it is not made here.
 *
 * "See what we kept" opens the receipt under the bar: the sentences the
 * conversation handed over, in her words, and the five things on this page
 * they set. A claim to have personalised a page is a claim, and this is what
 * stands behind it. Changing any of it is one press away, in the same panel
 * the chat pill opens.
 *
 * It gates nothing. Every listing, every price and every permit line on this
 * page is open whether she signs in or presses Not now, and Not now stays
 * dismissed for the visit rather than reappearing on the next navigation,
 * which is the usual way a nudge turns into a nag.
 */

export interface KeptSetting {
  label: string;
  value: string;
}

export function NudgeBar({
  kept,
  onKeep,
  onDismiss,
  onEdit,
}: {
  /** What the conversation set on this page, as it stands now. */
  kept: readonly KeptSetting[];
  onKeep: () => void;
  onDismiss: () => void;
  /** Opens the panel where any of it can be changed. */
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function away(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div
      ref={box}
      className={cn(
        "relative border-b border-[#E7C9AF] bg-warm-tint px-4 py-[11px] sm:px-6",
        // The receipt hangs below this bar, over the page. The sticky bar
        // under it is z-30, so while the receipt is open this rises above
        // it; the rest of the time it stays under, so the sticky bar wins
        // the scroll the way it should.
        open ? "z-40" : "z-20",
      )}
    >
      <div className="mx-auto flex w-full max-w-[1328px] flex-wrap items-center gap-x-3.5 gap-y-2">
        <p className="text-[13px]/5 font-medium text-ink">
          This page was set up from your ChatGPT conversation.
        </p>
        <p className="text-[13px]/5 text-ink-body">
          Sign in to keep it. Without an account it lasts until you close this
          tab.{" "}
          <button
            type="button"
            aria-expanded={open}
            aria-controls="what-we-kept"
            onClick={() => setOpen((o) => !o)}
            className="font-medium text-ink underline underline-offset-2"
          >
            {open ? "Hide what we kept" : "See what we kept"}
          </button>
        </p>
        <span className="grow" />
        <button
          type="button"
          onClick={onKeep}
          className="min-h-9 shrink-0 rounded-full bg-ink px-[18px] py-2 text-[13px]/5 font-medium text-white sm:min-h-0"
        >
          Sign in to keep it
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-9 shrink-0 text-[13px]/5 text-ink-prose underline underline-offset-2 sm:min-h-0"
        >
          Not now
        </button>
      </div>

      {open ? (
        <div
          id="what-we-kept"
          role="region"
          aria-label="What we kept from your conversation"
          className="absolute inset-x-0 top-full px-4 sm:px-6"
        >
          <div className="relative mx-auto grid w-full max-w-[1328px] gap-x-10 gap-y-6 rounded-b-[10px] border border-t-0 border-hairline bg-background px-6 pt-6 pb-6 shadow-[0_10px_30px_rgba(22,24,26,0.12)] sm:px-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              <svg width="12" height="12" viewBox="0 0 11 11" fill="none" aria-hidden>
                <path d="M1 1L10 10M10 1L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="sr-only">Close what we kept</span>
            </button>
            <div className="flex flex-col gap-3">
              <Eyebrow>What you said · {CONTEXT_DATE}</Eyebrow>
              <ol className="flex flex-col gap-1.5">
                {SENTENCES.map((sentence, i) => (
                  <li key={i} className="text-[15px]/[24px] text-ink">
                    {sentence.map((part, j) =>
                      typeof part === "string" ? (
                        <span key={j}>{part}</span>
                      ) : (
                        <span
                          key={j}
                          className="underline decoration-dotted decoration-[#B6BBBE] underline-offset-4"
                        >
                          {part.text}
                        </span>
                      ),
                    )}
                  </li>
                ))}
              </ol>
              <p className="text-[12px]/[18px] text-ink-muted">
                The underlined parts are what this page reads. The rest is
                kept with them so the sentence still makes sense to you later.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Eyebrow>What it set on this page</Eyebrow>
              <dl className="flex flex-col">
                {kept.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-4 border-b border-hairline py-2 last:border-b-0"
                  >
                    <dt className="text-[12px]/5 text-ink-muted">{row.label}</dt>
                    <dd className="text-right text-[13px]/5 font-medium text-ink">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onEdit();
                  }}
                  className="text-[13px]/5 font-medium text-action-deep underline underline-offset-2"
                >
                  Change any of it
                </button>
                <span className="text-[12px]/[18px] text-ink-muted">
                  None of this has been sent to an agent.
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "font-mono text-[10px]/3 font-medium tracking-[0.09em] text-ink-muted uppercase",
      )}
    >
      {children}
    </span>
  );
}
