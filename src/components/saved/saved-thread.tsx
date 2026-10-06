"use client";

import { useState, type ReactNode } from "react";
import { VoiceNote } from "@/components/saved/voice-note";
import { CAST, type Message } from "@/data/saved";
import { cn } from "@/lib/utils";
import { useSaved } from "./saved-provider";
import { Face } from "./share-menu";
import { VoiceRecorder } from "./voice-recorder";

/**
 * A conversation on one thing, followed by the box she answers in.
 *
 * This is the part of the page that could not have come from a spreadsheet.
 * Her mother in Tamil, her sister arguing back, the agent with a date on a
 * permit, and all of it attached to the house rather than sitting in an
 * inbox. A message is read off `CAST` for its name, its role and its colour,
 * so the agent is always blue and the family always warm, and a voice note is
 * drawn by `VoiceNote` so the Tamil is never dropped.
 *
 * It does not know what it is attached to. `on` is a listing id, a collection
 * id, or a listing id in the agent lane, `fixture` is whatever that thing
 * already held, and the session's replies are read from the store under the
 * same key. A house thread, a set thread and the lane the agent reads are the
 * same component with different ids, which is the only reason the rule "the
 * family talks in one place and the agent in another" can be kept by the
 * caller rather than re-argued here.
 *
 * `under` is what lets the family lane offer to send one message across
 * without this file knowing what an agent is. It draws whatever the caller
 * hands back beneath the words.
 *
 * It draws no box of its own. The caller decides what it sits in.
 */
export function SavedThread({
  on,
  fixture,
  placeholder = "Write something",
  under,
  quiet,
}: {
  /** The listing id, collection id or agent-lane key these words are about. */
  on: string;
  /** What the fixture already holds. Session replies are read from the store. */
  fixture: readonly Message[];
  /** The composer's prompt. A set thread says what the set is. */
  placeholder?: string;
  /** Drawn under one message. The family lane puts the send control here. */
  under?: (message: Message) => ReactNode;
  /** What to say when nobody has said anything yet. */
  quiet?: string;
}) {
  const { state, dispatch } = useSaved();
  const [draft, setDraft] = useState("");
  const messages: readonly Message[] = [
    ...fixture,
    ...(state.replies[on] ?? []),
  ];

  return (
    <div className="flex flex-col gap-3">
      {messages.length > 0 ? (
        <ul className="flex flex-col gap-3.5">
          {messages.map((message) => (
            <li key={message.id}>
              <MessageRow message={message} under={under} />
            </li>
          ))}
        </ul>
      ) : quiet ? (
        <p className="text-[13px]/[19px] text-ink-muted">{quiet}</p>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim()) return;
          dispatch({ type: "reply", on, from: "nirosha", text: draft });
          setDraft("");
        }}
        className={cn(
          "flex items-center gap-2",
          (messages.length > 0 || quiet) && "border-t border-hairline pt-3",
        )}
      >
        <Face person="nirosha" size="sm" />
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label={placeholder}
          placeholder={placeholder}
          className="min-w-0 grow rounded-lg border border-transparent bg-transparent px-1 py-1.5 text-[13px]/[19px] text-ink placeholder:text-ink-faint focus-visible:border-hairline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
        />
        <VoiceRecorder on={on} />
      </form>
    </div>
  );
}

function MessageRow({
  message,
  under,
}: {
  message: Message;
  under?: (message: Message) => ReactNode;
}) {
  const person = CAST[message.from];
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Face person={message.from} size="sm" />
        <span className="text-[13px]/[19px] font-semibold text-ink">
          {person.name}
        </span>
        {person.role ? (
          <span className="font-mono text-[10px] tracking-[0.1em] text-action-deep uppercase">
            {person.role}
          </span>
        ) : null}
        {message.forwarded ? (
          <span className="font-mono text-[10px] tracking-[0.1em] text-ink-muted uppercase">
            Sent across
          </span>
        ) : null}
        <span className="ml-auto shrink-0 text-[11px]/4 text-ink-muted">
          {message.when}
        </span>
      </div>
      {message.voice ? (
        <div className="pl-8">
          <VoiceNote
            seconds={message.voice.seconds}
            tamil={message.voice.spoken?.text}
            english={message.text}
            speaker={person.name}
          />
        </div>
      ) : (
        <p className="pl-8 text-[13px]/[20px] text-ink-body">{message.text}</p>
      )}
      {under ? <div className="pl-8">{under(message)}</div> : null}
    </div>
  );
}
