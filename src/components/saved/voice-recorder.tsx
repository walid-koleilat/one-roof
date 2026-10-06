"use client";

import { useEffect, useState } from "react";
import { useSaved } from "./saved-provider";

/**
 * The button that makes a voice note, and what it honestly is.
 *
 * Amma's notes arrive spoken because that is how she leaves them, and the
 * composer under every thread owes Nirosha the same gesture. But there is no
 * microphone behind this prototype and nothing here pretends otherwise: the
 * button starts a real clock, the clock runs for as long as she holds it, and
 * stopping files a note whose only content is that length. The label says
 * so in as many words, on the control, while it is running. `VoiceNote` then
 * says it again when the clip is played, in place of a transcript.
 *
 * The clock is a duration, not a date. It is read from `Date.now()` because
 * an elapsed timer that drifts is a lie of a different kind. It is the one
 * figure on the saved page that moves while she watches, and it moves
 * because it is a clock; a clock that held still would be the broken thing.
 */

const HONEST = "No microphone behind this. The note is the length you held it.";

/** "0:07" - minutes, then two digits of seconds, the shape every fixture clip uses. */
function clock(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function VoiceRecorder({
  on,
}: {
  /** The listing id or the collection id the note lands on. */
  on: string;
}) {
  const { dispatch } = useSaved();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const recording = startedAt !== null;

  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 200);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!recording) {
    return (
      <button
        type="button"
        onClick={() => {
          setElapsed(0);
          setStartedAt(Date.now());
        }}
        className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-hairline-strong bg-background px-3 text-[12px]/[18px] font-medium text-ink transition-colors duration-150 ease-out hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
      >
        <MicMark />
        Record a note
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Recording a note"
      className="flex shrink-0 flex-col items-end gap-1"
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full bg-warm motion-safe:animate-pulse"
        />
        <span className="font-mono text-[12px]/[18px] text-ink tabular-nums">
          {clock(elapsed)}
        </span>
        <button
          type="button"
          onClick={() => {
            dispatch({
              type: "reply",
              on,
              from: "nirosha",
              text: "",
              voice: { seconds: clock(elapsed) },
            });
            setStartedAt(null);
          }}
          className="flex h-8 items-center rounded-full bg-ink px-3 text-[12px]/[18px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
        >
          Stop
        </button>
      </div>
      <p className="max-w-[220px] text-right text-[11px]/[16px] text-ink-muted">
        {HONEST}
      </p>
    </div>
  );
}

function MicMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
      <rect
        x="5.5"
        y="1.5"
        width="5"
        height="8"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3.5 7.5 C3.5 10 5.5 12 8 12 C10.5 12 12.5 10 12.5 7.5 M8 12 V14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
