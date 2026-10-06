"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  type Clause,
  CONTEXT_DATE,
  type SearchPatch,
  searchPart,
  SENTENCES,
} from "@/data/context";
import { countFor, type SearchState } from "@/data/counts";
import { cn } from "@/lib/utils";

/**
 * The context, dropped over the page by the chat pill.
 *
 * This used to be a permanent band above the search, 290px of the fold spent
 * saying what the bar already says in one line. It is a panel now: the pill
 * names her words, and pressing it opens the full sentences, which is where
 * editing belongs. Scroll position holds; Escape and an outside click close
 * it; editing a clause recounts and leaves the panel open.
 *
 * Every underlined part is something she said. Pressing one shows the
 * choices with the number each would give, and the number moves before she
 * chooses, not after. That is the only thing that makes "from your chat"
 * true rather than a label.
 */
export function ContextPanel({
  state,
  tamilFirst,
  onApply,
  onClose,
  changed,
  signedIn,
  onKeep,
}: {
  state: SearchState;
  tamilFirst: boolean;
  onApply: (patch: SearchPatch) => void;
  onClose: () => void;
  /** She has changed something in here. Signed out, that is the moment to say the search is hers to lose. */
  changed: boolean;
  signedIn: boolean;
  onKeep: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Clause | null>(null);
  /** Where the open clause sits, so its choices open under it. */
  const [anchor, setAnchor] = useState(0);
  const [lineDismissed, setLineDismissed] = useState(false);

  useEffect(() => {
    function away(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) onClose();
    }
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", key);
    };
  }, [onClose]);

  const countWith = (patch: SearchPatch) =>
    countFor({ ...state, ...searchPart(patch) });

  return (
    <div
      ref={box}
      role="region"
      aria-label="What you told ChatGPT"
      className="absolute inset-x-0 top-full z-30 px-4 sm:px-6"
    >
      <div className="mx-auto w-full max-w-[1328px] rounded-b-[10px] border border-t-0 border-hairline bg-sunken px-6 pt-7 pb-[26px] shadow-[0_10px_30px_rgba(22,24,26,0.12)] sm:px-8">
        <div className="mb-[18px] flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-mono text-[10px]/3 font-medium tracking-[0.09em] text-ink-muted uppercase">
            What you told ChatGPT
          </span>
          <span aria-hidden className="size-1 rounded-full bg-ink-faint" />
          <span className="font-mono text-[10px]/3 tracking-[0.09em] text-ink-muted uppercase">
            {CONTEXT_DATE}
          </span>
          <span className="grow" />
          <Link
            href="/my-parents-are-moving-in"
            className="text-[13px]/5 font-medium text-action-deep underline underline-offset-2"
          >
            See the conversation
          </Link>
        </div>

        <ol className="flex flex-col gap-[3px]">
          {SENTENCES.map((sentence, i) => (
            <li key={i} className="relative flex flex-col gap-2">
              <p className="text-[18px]/[30px] text-ink">
                {sentence.map((part, j) =>
                  typeof part === "string" ? (
                    <span key={j}>{part}</span>
                  ) : (
                    <button
                      key={j}
                      type="button"
                      aria-expanded={open === part}
                      onClick={(event) => {
                        setAnchor(event.currentTarget.offsetLeft);
                        setOpen((o) => (o === part ? null : part));
                      }}
                      className={cn(
                        "rounded-sm px-1 text-ink underline decoration-2 underline-offset-[5px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action",
                        open === part
                          ? "bg-action-tint decoration-solid decoration-action"
                          : "decoration-dotted decoration-[#B6BBBE] hover:decoration-ink",
                      )}
                    >
                      {part.text}
                    </button>
                  ),
                )}
              </p>

              {sentence.map((part) =>
                typeof part !== "string" && open === part ? (
                  <Choices
                    key={part.text}
                    clause={part}
                    current={part.current(state, tamilFirst)}
                    countWith={countWith}
                    anchor={anchor}
                    onPick={(patch) => onApply(patch)}
                  />
                ) : null,
              )}
            </li>
          ))}
        </ol>

        {changed && !signedIn && !lineDismissed ? (
          <div className="mt-[26px] flex flex-col gap-3 border-t border-hairline pt-[22px]">
            <p className="text-[16px]/6 font-medium text-ink">
              You changed it, so it is yours now.
            </p>
            <p className="max-w-[720px] text-sm/[22px] text-ink-prose">
              Keep it and it is here on your phone, and next week. Without an
              account it lasts until you close this tab.
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
              <button
                type="button"
                onClick={onKeep}
                className="rounded-lg border-[1.5px] border-ink bg-background px-6 py-[13px] text-[15px]/[22px] font-medium text-ink transition-colors hover:bg-sunken"
              >
                Keep this search
              </button>
              <button
                type="button"
                onClick={() => setLineDismissed(true)}
                className="text-[15px]/[22px] font-medium text-ink underline underline-offset-2"
              >
                Carry on without one
              </button>
            </div>
            <p className="text-[13px]/5 text-ink-prose">
              An email address, and nothing else. Every one of the homes stays
              open either way, and no agent is told you looked.
            </p>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <p className="text-[13px]/5 text-ink-muted">
            Press any underlined part to change it. The counts above move while
            you do.
          </p>
          <span className="grow" />
          <button
            type="button"
            onClick={onClose}
            className="text-[13px]/5 font-medium text-ink underline underline-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The choices under a clause, each with the number it would give.
 *
 * The number is computed, not typed: it is the same table the bar reads, so
 * the option she picks reproduces the count she then sees. The box opens
 * under the clause she pressed, not at the start of the line.
 */
function Choices({
  clause,
  current,
  countWith,
  anchor,
  onPick,
}: {
  clause: Clause;
  current: number;
  countWith: (patch: SearchPatch) => number;
  anchor: number;
  onPick: (patch: SearchPatch) => void;
}) {
  return (
    <div
      style={{ marginLeft: `min(${anchor}px, 100% - 340px)` }}
      className="w-[340px] max-w-full overflow-hidden rounded-lg border border-hairline bg-background shadow-[0_6px_20px_rgba(22,24,26,0.10)]"
    >
      <p className="px-4 pt-3 pb-1 font-mono text-[10px]/3 font-medium tracking-[0.09em] text-ink-muted uppercase">
        You typed: &ldquo;{clause.said}&rdquo;
      </p>
      <ul role="radiogroup" className="flex flex-col">
        {clause.options.map((option, i) => {
          const picked = i === current;
          return (
            <li key={option.label}>
              <button
                type="button"
                role="radio"
                aria-checked={picked}
                onClick={() => onPick(option.patch)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors",
                  picked ? "bg-action-tint" : "hover:bg-sunken",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-4 shrink-0 rounded-full border",
                    picked
                      ? "border-[5px] border-action"
                      : "border-hairline-strong",
                  )}
                />
                <span
                  className={cn(
                    "grow text-sm/5",
                    picked ? "font-medium text-ink" : "text-ink-body",
                  )}
                >
                  {option.label}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-[13px]/5",
                    picked ? "font-medium text-action-deep" : "text-ink-muted",
                  )}
                >
                  {countWith(option.patch)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="border-t border-[#EFF1F1] px-4 py-2.5 text-[12px]/[18px] text-ink-muted">
        The count moves before you choose, not after.
      </p>
    </div>
  );
}
