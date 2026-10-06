"use client";

import { cn } from "@/lib/utils";

/** Where the reviewer is looking from. A phone is the same page in a frame. */
export type Device = "desktop" | "phone";

/**
 * The two switches this page branches on, exposed so a reader can try all four.
 *
 * It is scaffolding, not chrome, and it is drawn to look like it: ink ground,
 * orange mono label, nothing the product draws anywhere else. It is the one
 * thing on any screen that breaks character. Anything a reviewer might
 * mistake for product has to announce that it is not, and a floating control
 * in the corner is exactly the kind of thing that gets mistaken.
 *
 * Two switches the page branches on and no more. Context decides what the
 * page may claim about her; the account decides what it may keep. Every
 * difference between the four states is a consequence of one of those two,
 * and a third here would mean the design had grown a third reason to branch
 * without saying so. The third pair is not a branch: it changes where the
 * reviewer is looking from, not what the page claims, and it is only offered
 * on a screen wide enough to hold a phone.
 */
export function StateSwitch({
  hasContext,
  signedIn,
  device = "desktop",
  onContext,
  onSignedIn,
  onDevice,
}: {
  hasContext: boolean;
  signedIn: boolean;
  device?: Device;
  onContext: (next: boolean) => void;
  onSignedIn: (next: boolean) => void;
  /** Absent where there is no frame to show, and the pair is not drawn. */
  onDevice?: (next: Device) => void;
}) {
  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-ink px-[18px] py-3 shadow-[0_8px_24px_rgba(22,24,26,0.28)]">
      <span className="font-mono text-[10px]/3 font-medium tracking-[0.1em] text-flag uppercase">
        State
      </span>
      <Pair
        label="ChatGPT context"
        options={["On", "Off"]}
        active={hasContext ? "On" : "Off"}
        onPick={(pick) => onContext(pick === "On")}
      />
      <span aria-hidden className="h-5 w-px bg-[#3A3D40]" />
      <Pair
        label="Account"
        options={["Signed in", "Signed out"]}
        active={signedIn ? "Signed in" : "Signed out"}
        onPick={(pick) => onSignedIn(pick === "Signed in")}
      />
      {onDevice ? (
        <>
          <span aria-hidden className="hidden h-5 w-px bg-[#3A3D40] lg:block" />
          <Pair
            label="Device"
            options={["Desktop", "Phone"]}
            active={device === "phone" ? "Phone" : "Desktop"}
            onPick={(pick) => onDevice(pick === "Phone" ? "phone" : "desktop")}
            className="hidden lg:flex"
          />
        </>
      ) : null}
    </div>
  );
}

function Pair({
  label,
  options,
  active,
  onPick,
  className,
}: {
  label: string;
  options: readonly [string, string];
  active: string;
  onPick: (pick: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="font-mono text-[10px]/3 tracking-[0.08em] text-[#8C9095] uppercase">
        {label}
      </span>
      <div className="flex overflow-hidden rounded-full border border-[#3A3D40]">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={active === option}
            onClick={() => onPick(option)}
            className={cn(
              "px-3 py-[5px] text-[12px]/[18px] font-medium transition-colors",
              active === option
                ? "bg-background text-ink"
                : "text-[#8C9095] hover:text-white",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
