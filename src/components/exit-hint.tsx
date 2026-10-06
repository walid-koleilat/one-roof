"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Clicking nothing should teach you where something is.
 *
 * A prototype has a fraction of a real product's affordances, so a reader who
 * clicks a photograph and gets no response concludes the whole thing is a
 * picture. This listens for clicks that landed on nothing and answers them by
 * ringing the two places that actually go somewhere, rather than by putting a
 * "click here" banner over the design.
 *
 * It is a prototype affordance and not a product one. In the real thing every
 * card is a link, and this component would have nothing to point at.
 */

const HINT_MS = 2600;

const ExitHintContext = createContext<{ hinting: boolean }>({ hinting: false });

export function ExitHintProvider({ children }: { children: React.ReactNode }) {
  const [hinting, setHinting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback(() => {
    setHinting(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHinting(false), HINT_MS);
  }, []);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      // A click that found something real is not a lost click.
      if (target?.closest("a, button, [data-exit]")) return;
      flash();
    }
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [flash]);

  return (
    <ExitHintContext.Provider value={{ hinting }}>
      {children}
    </ExitHintContext.Provider>
  );
}

/**
 * Wraps a real destination. Rings when somebody has clicked into the void.
 */
export function Exit({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { hinting } = useContext(ExitHintContext);
  return (
    <span
      data-exit=""
      className={cn(
        "relative inline-flex rounded-full transition-shadow duration-300",
        hinting &&
          "shadow-[0_0_0_3px_var(--ds-action-tint),0_0_0_5px_var(--ds-action)] motion-safe:animate-pulse",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** The one line of instruction, shown only while the hint is up. */
export function ExitHintBanner() {
  const { hinting } = useContext(ExitHintContext);
  return (
    <div
      aria-live="polite"
      className={cn(
        // Top, not bottom: the composer lives at the bottom of the window and
        // this must not sit on top of it.
        // Under every dialog, and on a phone at the foot rather than over
        // the header, where the bar and the pill already live.
        "pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4 transition-opacity duration-300 max-sm:bottom-24 sm:top-4",
        hinting ? "opacity-100" : "opacity-0",
      )}
    >
      <p className="rounded-full bg-ink px-4 py-2 text-center text-[13px]/[19px] font-medium text-white shadow-lg sm:px-5 sm:py-2.5 sm:text-sm">
        Two things on this page go somewhere. They are ringed in teal.
      </p>
    </div>
  );
}
