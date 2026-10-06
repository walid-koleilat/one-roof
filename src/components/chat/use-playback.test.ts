import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sliceStep, streamText, usePlayback } from "./use-playback";
import type { Step } from "@/data/conversation";

const SAY: Step = {
  kind: "say",
  paragraphs: ["First one.", "Second one.", "Third."],
};

const LIST: Step = {
  kind: "list",
  lead: "Three shapes:",
  items: ["A suite.", "A ground floor.", "A basement."],
};

/**
 * What a half-written answer looks like decides whether streaming reads as an
 * assistant composing or as a rendering bug. These assertions pin the two
 * behaviours that separate the one from the other.
 */
describe("sliceStep", () => {
  it("fills paragraphs in order rather than every paragraph at half length", () => {
    const partial = sliceStep(SAY, 14);
    expect(partial).toMatchObject({
      paragraphs: ["First one.", "Sec"],
    });
  });

  it("returns nothing at all before the first character", () => {
    expect(sliceStep(SAY, 0)).toMatchObject({ paragraphs: [] });
  });

  it("returns the whole step once the budget covers it", () => {
    expect(sliceStep(SAY, streamText(SAY).length)).toMatchObject({
      paragraphs: SAY.kind === "say" ? SAY.paragraphs : [],
    });
  });

  it("writes a list's lead before any of its items", () => {
    const partial = sliceStep(LIST, 8);
    expect(partial).toMatchObject({ lead: "Three sh", items: [] });
  });

  it("leaves a card alone, since a card is served whole", () => {
    const ad: Step = { kind: "ad" };
    expect(sliceStep(ad, 3)).toBe(ad);
    expect(streamText(ad)).toBe("");
  });
});

/**
 * A turn that has been written must never leave the screen.
 *
 * There is a pause between the last character landing and the step being
 * committed, and the answer used to belong to neither list for the length of
 * it: dropped from `streaming` the moment it was complete, not yet in `shown`.
 * On the page that read as the answer blinking out and back in. The assertion
 * is that the finished answer is somewhere in the transcript on every tick.
 */
describe("usePlayback", () => {
  const SCRIPT: readonly Step[] = [
    { kind: "say", paragraphs: ["Hello."] },
    { kind: "ad" },
  ];

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /** Everything on screen, in order, however it got there. */
  function transcript(result: { shown: readonly Step[]; streaming: Step | null }) {
    return [...result.shown, ...(result.streaming ? [result.streaming] : [])];
  }

  it("keeps the finished answer on screen through the pause before the next turn", () => {
    const { result } = renderHook(() => usePlayback(SCRIPT, true));

    // Dots first: nothing of the answer exists yet.
    expect(result.current.thinking).toBe(true);
    expect(transcript(result.current)).toHaveLength(0);

    // The dots end and the first frame of the answer is scheduled. Each frame
    // needs its own act, since the timer for the next one is only set once
    // React has committed the last.
    act(() => void vi.advanceTimersByTime(900));
    act(() => void vi.advanceTimersByTime(26));

    const written = transcript(result.current);
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({ paragraphs: ["Hello."] });
    // Still mid-pause, so it has not been committed yet. This is the window
    // the turn used to disappear in.
    expect(result.current.shown).toHaveLength(0);

    // The pause ends and the same answer is simply now a finished step.
    act(() => void vi.advanceTimersByTime(420));
    expect(result.current.shown).toHaveLength(1);
    expect(result.current.streaming).toBeNull();
    expect(transcript(result.current)).toHaveLength(1);
  });

  it("starts finished when playback is off, so nothing animates", () => {
    const { result } = renderHook(() => usePlayback(SCRIPT, false));
    expect(result.current.done).toBe(true);
    expect(result.current.shown).toEqual(SCRIPT);
  });
});
