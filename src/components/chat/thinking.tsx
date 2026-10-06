"use client";

/**
 * Three dots, which is the only honest thing to show while an answer is coming.
 *
 * A progress bar would claim to know how long this takes and a spinner would
 * claim something is loading. Neither is true: the assistant is composing, and
 * the reader's question is only "is it still working". Dots answer that and
 * nothing else.
 */
export function Thinking() {
  return (
    <div
      className="flex items-center gap-1.5 py-1"
      role="status"
      aria-label="ChatGPT is thinking"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2 animate-bounce rounded-full bg-gpt-faint/70 motion-reduce:animate-none"
          style={{ animationDelay: `${i * 140}ms`, animationDuration: "1s" }}
        />
      ))}
    </div>
  );
}
