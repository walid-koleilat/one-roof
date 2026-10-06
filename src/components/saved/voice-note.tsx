"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Her mother's voice, and the two lines underneath that make it usable.
 *
 * Amma has no English. She is the person this house is being bought for, and a
 * product that holds a family's conversation but only works in one language
 * holds half of it. So her notes arrive the way she leaves them - spoken - and
 * the Tamil is written under the waveform with the English under that.
 *
 * There is no audio file. Pressing play animates the bars and reveals the
 * transcript, because what is being prototyped is that the translation exists
 * and sits with the house, not that sound plays.
 *
 * A note recorded in this session has no transcript at all, because there is
 * no microphone behind the button that made it. This component says so after
 * play rather than leaving a blank where words would go; a blank would let the
 * reader assume the machine heard something and lost it.
 */

const BARS = [
  4, 9, 14, 8, 17, 22, 13, 7, 19, 26, 15, 9, 21, 12, 6, 16, 23, 11, 5, 14, 20,
  8, 12, 18, 7, 4, 11, 16, 9, 5,
];

const NO_TRANSCRIPT =
  "Nothing has been transcribed. There is no microphone behind this button.";

export function VoiceNote({
  seconds,
  tamil,
  english,
  speaker,
}: {
  seconds: string;
  /** What was said, when it was not said in English. Absent on a note recorded here. */
  tamil?: string;
  /** The English she reads. Absent, or empty, on a note recorded here. */
  english?: string;
  /** Whose note it is, for the play button's name. "Amma", "Appa". */
  speaker?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);
  // Derived, not stored: the note is over when the last bar is lit, and
  // keeping that as state would mean setting it from inside the tick.
  const done = at >= BARS.length;
  const running = playing && !done;

  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setAt((i) => i + 1), 70);
    return () => clearTimeout(id);
  }, [running, at]);

  const heard = at > 0;
  const hasTamil = Boolean(tamil && tamil.trim());
  const hasEnglish = Boolean(english && english.trim());
  const transcribed = hasTamil || hasEnglish;

  // `warm-tint`, not `accent-tint`: the latter was never a token, so this
  // panel shipped with no background at all. Warm is the family's colour.
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-warm-tint/70 p-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={
            running ? "Pause" : `Play ${speaker ? `${speaker}'s` : "the"} note`
          }
          onClick={() => {
            if (done) setAt(0);
            setPlaying((p) => done || !p);
          }}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
        >
          {running ? (
            <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
              <rect x="2" y="1.5" width="3" height="9" rx="1" fill="#FFFFFF" />
              <rect x="7" y="1.5" width="3" height="9" rx="1" fill="#FFFFFF" />
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
              <path d="M3 1.6 L10 6 L3 10.4 Z" fill="#FFFFFF" />
            </svg>
          )}
        </button>

        <span aria-hidden className="flex grow items-center gap-[2px]">
          {BARS.map((height, i) => (
            <span
              key={i}
              className={cn(
                "w-[3px] rounded-full transition-colors duration-150 ease-out",
                i < at ? "bg-warm" : "bg-ink/20",
              )}
              style={{ height: `${height}px` }}
            />
          ))}
        </span>

        <span className="shrink-0 font-mono text-[11px] text-ink-muted">
          {seconds}
        </span>
      </div>

      {heard ? (
        <div className="flex flex-col gap-1 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-250 motion-safe:ease-out">
          {transcribed ? (
            <>
              {hasTamil ? (
                <p lang="ta" className="text-[13px]/[21px] text-ink-body">
                  {tamil}
                </p>
              ) : null}
              {hasEnglish ? (
                <p className="text-[13px]/[20px] text-ink">
                  <span className="font-mono text-[10px] tracking-[0.1em] text-ink-faint uppercase">
                    {hasTamil
                      ? "Tamil, transcribed and translated"
                      : "Transcribed"}
                  </span>
                  <br />
                  {english}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-[12px]/[18px] text-ink-muted">{NO_TRANSCRIPT}</p>
          )}
        </div>
      ) : (
        <p className="text-[12px]/[18px] text-ink-muted">
          {hasTamil
            ? "Press play. The Tamil and the English appear underneath."
            : hasEnglish
              ? "Press play. The transcript appears underneath."
              : "Press play. There is no transcript, and it says so."}
        </p>
      )}
    </div>
  );
}
