"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { Step } from "@/data/conversation";

/**
 * Plays a conversation back one turn at a time, and streams the answers.
 *
 * A transcript that appears in finished blocks is a transcript. What makes an
 * assistant feel like it is answering rather than reciting is that the words
 * arrive while you are already reading them, so an assistant turn here goes
 * through three states: a pause with dots, then text unspooling a few
 * characters at a time, then done.
 *
 * Four things this deliberately does:
 *
 *   - It can always be skipped. A reviewer with four minutes should never be
 *     held hostage by an animation, so `skip` jumps to the end and every
 *     surface that uses this exposes it.
 *   - It obeys `prefers-reduced-motion` by starting finished. Somebody who has
 *     asked their operating system not to animate things has asked us too.
 *   - It types her questions out and pauses before the answers, because those
 *     are two different acts. She is composing; the assistant is working.
 *   - Cards do not stream. The advert and the widget are served whole, because
 *     that is what they are: a slot being filled, not somebody thinking.
 */

/** Upper bound on how long a single keystroke takes. */
const CHAR_MS = 30;
/** and on the whole question, so a long one does not outstay its welcome. */
const MAX_TYPING_MS = 4600;
/** She reads the answer before she starts typing the next question. */
const REST_BEFORE_ASK_MS = 1400;
/** Hand off the keyboard: typed, then a beat, then sent. */
const SEND_MS = 700;

/** The dots, before a single word of the answer exists. */
const THINK_MS = 900;
/**
 * How fast the answer arrives, in characters per frame and milliseconds per
 * frame. Roughly 450 words a minute: faster than anyone reads, slow enough
 * that the text is visibly being written rather than pasted.
 */
const STREAM_CHARS = 7;
const STREAM_MS = 26;
/** A whole answer takes at most this long however long it is. */
const MAX_STREAM_MS = 4200;
/** A card being served is not the assistant composing, so it is quicker. */
const SERVE_MS = 1100;
/** After the last word lands, a beat before the next turn begins. */
const SETTLE_MS = 420;

interface State {
  /** Steps already finished and on screen. */
  shown: number;
  /** How much of the current question has been typed. */
  typed: number;
  /** How much of the current answer has been streamed. -1 means "still thinking". */
  revealed: number;
  done: boolean;
}

type Action =
  | { type: "tick-typing" }
  | { type: "start-stream" }
  | { type: "tick-stream"; by: number }
  | { type: "commit" }
  | { type: "skip" }
  | { type: "restart" };

const START: State = { shown: 0, typed: 0, revealed: -1, done: false };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "tick-typing":
      return { ...state, typed: state.typed + 1 };
    case "start-stream":
      return { ...state, revealed: 0 };
    case "tick-stream":
      return { ...state, revealed: state.revealed + action.by };
    case "commit":
      return { ...START, shown: state.shown + 1 };
    case "skip":
      return { ...START, done: true };
    case "restart":
      return START;
  }
}

/** The text a step streams. Cards return "" and are served whole. */
export function streamText(step: Step): string {
  switch (step.kind) {
    case "say":
      return step.paragraphs.join(" ");
    case "list":
      return [step.lead, ...step.items].join(" ");
    default:
      return "";
  }
}

/**
 * The same step with only the first `n` characters of its text present.
 *
 * Paragraphs and list items are filled in order, so a half-written answer is
 * a whole first paragraph and part of a second rather than every paragraph at
 * half length. Empty trailing pieces are dropped instead of rendering as gaps.
 */
export function sliceStep(step: Step, n: number): Step {
  const take = (parts: readonly string[]) => {
    let left = n;
    const out: string[] = [];
    for (const part of parts) {
      if (left <= 0) break;
      out.push(left >= part.length ? part : part.slice(0, left));
      // The joining space costs a character, same as it does in `streamText`.
      left -= part.length + 1;
    }
    return out;
  };

  if (step.kind === "say") return { ...step, paragraphs: take(step.paragraphs) };
  if (step.kind === "list") {
    const [lead = "", ...items] = take([step.lead, ...step.items]);
    return { ...step, lead, items };
  }
  return step;
}

export function usePlayback(script: readonly Step[], enabled: boolean) {
  const [state, dispatch] = useReducer(
    reducer,
    enabled ? START : { ...START, done: true },
  );

  const done = state.done || state.shown >= script.length;
  const next = done ? undefined : script[state.shown];
  const isAsk = next?.kind === "ask";
  const text = useMemo(() => (next ? streamText(next) : ""), [next]);

  useEffect(() => {
    if (!next) return;

    // She types.
    if (isAsk) {
      const full = next.text.length;
      if (state.typed >= full) {
        const id = setTimeout(() => dispatch({ type: "commit" }), SEND_MS);
        return () => clearTimeout(id);
      }
      // Nothing appears in the composer for a moment first. She has just been
      // handed three paragraphs; a question that begins typing itself the
      // instant the answer lands reads as a machine replying to a machine.
      const perChar = Math.max(7, Math.min(CHAR_MS, MAX_TYPING_MS / full));
      const id = setTimeout(
        () => dispatch({ type: "tick-typing" }),
        state.typed === 0 ? REST_BEFORE_ASK_MS : perChar,
      );
      return () => clearTimeout(id);
    }

    // A card. Served whole, after a short beat.
    if (!text) {
      const id = setTimeout(() => dispatch({ type: "commit" }), SERVE_MS);
      return () => clearTimeout(id);
    }

    // Dots, then words.
    if (state.revealed < 0) {
      const id = setTimeout(() => dispatch({ type: "start-stream" }), THINK_MS);
      return () => clearTimeout(id);
    }
    if (state.revealed >= text.length) {
      const id = setTimeout(() => dispatch({ type: "commit" }), SETTLE_MS);
      return () => clearTimeout(id);
    }
    const by = Math.max(
      STREAM_CHARS,
      Math.ceil(text.length / (MAX_STREAM_MS / STREAM_MS)),
    );
    const id = setTimeout(() => dispatch({ type: "tick-stream", by }), STREAM_MS);
    return () => clearTimeout(id);
  }, [next, isAsk, text, state.typed, state.revealed]);

  const skip = useCallback(() => dispatch({ type: "skip" }), []);
  const restart = useCallback(() => dispatch({ type: "restart" }), []);

  return {
    /** Finished steps, in order. */
    shown: done ? script : script.slice(0, state.shown),
    /**
     * The answer currently being written, already truncated.
     *
     * It keeps being returned after the last character lands, whole, until the
     * step is committed. Dropping it at `revealed === text.length` left the
     * finished answer belonging to neither list for the length of the settle
     * pause: gone from here, not yet in `shown`. The turn blinked out and back
     * in, which is the one thing a transcript must never do.
     */
    streaming:
      next && text && state.revealed >= 0
        ? sliceStep(next, state.revealed)
        : null,
    /** Partial question text for the composer, or null when she is not typing. */
    typing: isAsk ? next.text.slice(0, state.typed) : null,
    /** True during the pause before the first word of an answer exists. */
    thinking: Boolean(next) && !isAsk && Boolean(text) && state.revealed < 0,
    done,
    skip,
    restart,
  };
}

/** True when the reader has asked their system not to animate things. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, force] = useReducer(() => true, false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (query.matches) force();
  }, []);
  return reduced;
}
