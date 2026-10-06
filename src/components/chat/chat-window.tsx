"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The macOS ChatGPT window, drawn from the outside.
 *
 * This is scenery, and it is built as scenery on purpose. J1's argument only
 * works if the reader recognises the room before they notice the furniture we
 * put in it: the sidebar of half-finished chats, the model switcher, the
 * disclaimer under the composer. None of it is interactive, and pretending
 * otherwise would be building somebody else's product.
 *
 * Everything inside `children` is the part we are actually designing.
 */

const CHATS = [
  "Room for my parents",
  "Stairlift vs main floor bed…",
  "Appa physio schedule",
  "Power of attorney Ontario",
  "Cost of a garden suite",
  "Thanksgiving for eight",
] as const;

const RAIL = ["New chat", "Search chats", "Images", "Apps", "Projects"] as const;

export function ChatWindow({
  children,
  /** Partial text of the question she is composing, or null. */
  typing,
  /** Shown under the composer while playback is running. */
  control,
  className,
}: {
  children: React.ReactNode;
  typing?: string | null;
  control?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // A container, not a viewport. The window can be narrowed on a desktop
        // to show what a phone gets, and everything inside has to follow the
        // frame it is actually in rather than the size of the screen.
        "@container flex overflow-hidden bg-background sm:rounded-xl sm:border sm:border-[#D4D4D4]",
        className,
      )}
    >
      <Sidebar />
      {/*
        `min-h-0` on this column is what makes the transcript scroll instead of
        the page. Without it the column grows to fit its content, the composer
        is pushed below the fold, and the one thing the reader needs in view -
        the box her question is being typed into - is the thing they cannot see.
      */}
      <div className="flex min-h-0 min-w-0 grow flex-col">
        <TitleBar />
        <div
          data-slot="transcript"
          className="flex min-h-0 grow flex-col items-center overflow-y-auto overscroll-contain px-3 @min-[560px]:px-6"
        >
          <div className="w-full max-w-[768px] py-5 sm:py-6">{children}</div>
        </div>
        <Composer typing={typing} control={control} />
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside
      aria-hidden
      className="hidden w-[260px] shrink-0 flex-col gap-6 bg-gpt-rail px-3 py-4 @min-[900px]:flex"
    >
      <div className="flex items-center gap-2 px-1">
        <span className="size-3 rounded-full bg-[#FF5F57]" />
        <span className="size-3 rounded-full bg-[#FEBC2E]" />
        <span className="size-3 rounded-full bg-[#28C840]" />
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="size-[22px] rounded-full border border-gpt-ink" />
        <span className="size-[18px] rounded-[5px] border border-gpt-faint/60" />
      </div>

      <nav className="flex flex-col gap-0.5">
        {RAIL.map((item) => (
          <span
            key={item}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-gpt-ink"
          >
            <span className="size-[15px] rounded bg-gpt-rail-active" />
            {item}
          </span>
        ))}
      </nav>

      <div className="flex flex-col gap-0.5">
        <span className="px-2 pb-1 text-xs text-gpt-faint">Your chats</span>
        {CHATS.map((chat, i) => (
          <span
            key={chat}
            className={cn(
              "truncate rounded-lg px-2 py-1.5 text-sm text-gpt-ink",
              i === 0 && "bg-gpt-rail-active",
            )}
          >
            {chat}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between px-1">
        <span className="flex items-center gap-2">
          <span className="size-[26px] rounded-full bg-gpt-rail-active" />
          <span className="flex flex-col">
            <span className="text-[13px]/4 font-medium text-gpt-ink">Nirosha</span>
            <span className="text-[11px]/4 text-gpt-faint">Free</span>
          </span>
        </span>
        <span className="rounded-full border border-gpt-hairline px-2.5 py-1 text-[11px] text-gpt-ink">
          Upgrade
        </span>
      </div>
    </aside>
  );
}

function TitleBar() {
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-between gap-3 px-4 py-3.5 @min-[560px]:px-5"
    >
      <span className="shrink-0 text-sm font-medium text-gpt-ink @min-[560px]:w-[200px] @min-[560px]:text-[15px]">
        ChatGPT <span className="text-gpt-faint">⌄</span>
      </span>
      <span className="flex items-center gap-1 rounded-full bg-gpt-bubble p-0.5 text-[13px]">
        <span className="rounded-full bg-background px-3 py-1 text-gpt-ink shadow-sm">
          Chat
        </span>
        <span className="px-3 py-1 text-gpt-muted">Work</span>
      </span>
      <span className="hidden items-center justify-end gap-4 text-[13px] text-gpt-muted @min-[560px]:flex @min-[560px]:w-[200px]">
        Share <span className="font-semibold">...</span>
      </span>
    </div>
  );
}

function Composer({
  typing,
  control,
}: {
  typing?: string | null;
  control?: React.ReactNode;
}) {
  const composing = typeof typing === "string" && typing.length > 0;
  return (
    <div className="relative flex shrink-0 flex-col items-center gap-2 bg-background px-3 pt-2 pb-3 sm:px-6 sm:pb-4">
      {/* The transcript fades out under the composer rather than being cut. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-b from-transparent to-background"
      />
      <div
        className={cn(
          "flex min-h-[52px] w-full max-w-[768px] items-center gap-3 rounded-[26px] border px-4 py-3 transition-colors",
          composing ? "border-gpt-ink/25" : "border-gpt-hairline",
        )}
      >
        <span aria-hidden className="size-5 shrink-0 rounded bg-gpt-rail-active" />
        <span
          className={cn(
            "grow text-[15px]/[22px]",
            composing ? "text-gpt-ink" : "text-gpt-faint",
          )}
        >
          {composing ? typing : "Ask anything"}
          {composing ? (
            <span className="ml-px inline-block h-[18px] w-px translate-y-[3px] animate-pulse bg-gpt-ink motion-reduce:animate-none" />
          ) : null}
        </span>
        <span aria-hidden className="size-[18px] shrink-0 rounded bg-gpt-rail-active" />
        <span
          aria-hidden
          className={cn(
            "size-8 shrink-0 rounded-full transition-colors",
            composing ? "bg-gpt-ink" : "bg-gpt-rail-active",
          )}
        />
      </div>
      {control ?? (
        <p className="text-center text-[11px] text-gpt-faint">
          ChatGPT can make mistakes. Check important info. See Cookie Preferences.
        </p>
      )}
    </div>
  );
}
