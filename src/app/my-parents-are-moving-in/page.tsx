"use client";

import { AppWidget } from "@/components/app-widget";
import {
  AssistantList,
  AssistantProse,
  SourceChips,
  UserBubble,
} from "@/components/chat/chat-turn";
import { ChatWindow } from "@/components/chat/chat-window";
import { Thinking } from "@/components/chat/thinking";
import {
  usePlayback,
  usePrefersReducedMotion,
} from "@/components/chat/use-playback";
import { ExitHintBanner, ExitHintProvider } from "@/components/exit-hint";
import { Wordmark } from "@/components/wordmark";
import { SponsoredCard } from "@/components/sponsored-card";
import { AD_DISCLAIMER, SCRIPT, type Step } from "@/data/conversation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * She does not start on a portal. She starts by describing a problem.
 *
 * The screen exists to draw one boundary and then show what fits inside it.
 * One Roof reaches this conversation twice, and the two appearances are
 * governed by different rules:
 *
 *   The sponsored card is unsolicited, so it may not name a house.
 *   The app widget was called by name, so it may.
 *
 * The page plays rather than prints, because that boundary only exists in the
 * order things happen. A reader who sees the advert and the widget at the same
 * moment sees two cards from the same company; a reader who watches the advert
 * arrive uninvited and the widget arrive after an @-mention sees the rule.
 */
export default function RoomForMyParentsPage() {
  const reduced = usePrefersReducedMotion();
  /**
   * Narrows the window to a phone, for a reviewer sitting at a laptop.
   *
   * It works because everything inside reads a container query rather than the
   * viewport, so squeezing the frame is genuinely the same code path a phone
   * takes. It is not a device emulator and does not pretend to be one.
   */
  const [phone, setPhone] = useState(false);
  const { shown, streaming, typing, thinking, done, skip, restart } =
    usePlayback(SCRIPT, !reduced);
  const tail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (done || reduced) return;
    // `nearest` scrolls the transcript pane and leaves the page alone, so the
    // composer and the window chrome stay exactly where they are.
    tail.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [shown.length, streaming, typing, thinking, done, reduced]);

  return (
    <ExitHintProvider>
      <main className="h-[calc(100dvh-var(--tour-inset,0px))] overflow-hidden bg-[#EDEDEA]">
        <div className="h-full sm:px-8 sm:py-8 lg:px-14 lg:py-12">
          {/*
            The page's only heading, and it is hidden.
            
            Drawing one would put our title inside somebody else's product -
            this screen is a ChatGPT window, and ChatGPT windows do not carry
            a page heading. A screen reader still needs to be told what it has
            landed on, so the heading exists and is not painted.
          */}
          <h1 className="sr-only">My parents are moving in</h1>

          <DeviceToggle on={phone} onChange={setPhone} />

          <ChatWindow
            className={cn(
              "mx-auto w-full",
              phone ? "h-full max-w-[390px]" : "h-full max-w-[1328px]",
            )}
            typing={typing}
            control={
              <PlaybackControl done={done} onSkip={skip} onRestart={restart} />
            }
          >
            <div className="flex flex-col gap-6">
              {/*
                One list, whose last entry may be half-written. Keying by
                position means the turn that was streaming and the turn that
                just finished are the same DOM node, so nothing unmounts at the
                moment the last word lands. Rendering the streaming turn
                separately looked right until you watched it finish: the text
                was replaced by an identical copy, which played the entrance
                animation again and read as a blink.
              */}
              {(streaming ? [...shown, streaming] : shown).map((step, i) => (
                <Turn key={i} step={step} />
              ))}
              {thinking ? <Thinking /> : null}
              <div ref={tail} />
            </div>
          </ChatWindow>
        </div>
        <ExitHintBanner />
      </main>
    </ExitHintProvider>
  );
}

/**
 * One turn.
 *
 * Turns that arrive whole - her questions, the source chips, the advert, the
 * widget - fade up, because something appearing at full opacity out of nowhere
 * is a jump cut. Turns that stream do not: the words arriving one after another
 * is already the entrance, and fading the container at the same time makes the
 * first line look like it is being written twice.
 */
function Turn({ step }: { step: Step }) {
  const streams = step.kind === "say" || step.kind === "list";
  return (
    <div
      className={
        streams
          ? undefined
          : "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500"
      }
    >
      {render(step)}
    </div>
  );
}

function render(step: Step) {
  switch (step.kind) {
    case "ask":
      return <UserBubble>{step.text}</UserBubble>;
    case "say":
      return <AssistantProse paragraphs={step.paragraphs} />;
    case "list":
      return <AssistantList lead={step.lead} items={step.items} />;
    case "sources":
      return <SourceChips sources={step.sources} />;
    case "ad":
      return (
        <div className="flex flex-col gap-4">
          <hr className="border-gpt-hairline" />
          <SponsoredCard />
          <div className="flex flex-col gap-1">
            {AD_DISCLAIMER.map((line) => (
              <p key={line} className="text-[11px]/4 text-gpt-faint">
                {line}
              </p>
            ))}
          </div>
          <hr className="border-gpt-hairline" />
        </div>
      );
    case "widget":
      return (
        <div className="flex flex-col gap-3">
          <Wordmark width={92} />
          <AppWidget />
        </div>
      );
  }
}

/**
 * Skip and replay, in the composer's footnote slot.
 *
 * A reviewer with four minutes should never be held hostage by an animation,
 * so the way out is visible from the first second rather than hidden behind a
 * hover.
 */
function PlaybackControl({
  done,
  onSkip,
  onRestart,
}: {
  done: boolean;
  onSkip: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="flex items-center gap-3 text-[11px] text-gpt-faint">
      <span className="hidden sm:inline">
        ChatGPT can make mistakes. Check important info.
      </span>
      <button
        type="button"
        onClick={done ? onRestart : onSkip}
        className="rounded-full border border-gpt-hairline px-3 py-1 font-medium text-gpt-muted transition-colors hover:border-gpt-faint hover:text-gpt-ink"
      >
        {done ? "Restart" : "Skip to the end"}
      </button>
    </div>
  );
}

/**
 * Desktop or phone, for somebody reviewing this on a laptop.
 *
 * A prototype that only ever shows one width invites the question of what the
 * other one looks like, and the honest answer has to be shown rather than
 * described. It hides itself below 900px, where the window is already the
 * narrow one and the choice would be a lie.
 */
function DeviceToggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="mx-auto hidden w-full max-w-[1328px] justify-end pb-2 lg:flex">
      <div
        role="group"
        aria-label="Preview width"
        className="flex items-center gap-0.5 rounded-full border border-[#D4D4D4] bg-background p-0.5"
      >
        {(
          [
            ["Desktop", false],
            ["Phone", true],
          ] as const
        ).map(([label, value]) => (
          <button
            key={label}
            type="button"
            aria-pressed={on === value}
            onClick={() => onChange(value)}
            className={cn(
              "rounded-full px-3 py-1 text-[12px]/[18px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action",
              on === value
                ? "bg-ink text-white"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
