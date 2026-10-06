"use client";

import { MINUTE_STOPS, type Minutes } from "@/data/counts";
import { cn } from "@/lib/utils";

/**
 * How far, as a stepper over the five declared stops.
 *
 * The same control the short-let site uses for bedrooms: a minus, the
 * value, a plus. It walks stops rather than minutes, because the count
 * table has a row at each stop and none in between, so every value it can
 * show is one the table can answer for.
 */
export function MinutesStepper({
  name,
  minutes,
  onChange,
  disabled = false,
}: {
  /** What the minutes are to, for the buttons' labels. */
  name: string;
  minutes: Minutes;
  onChange: (minutes: Minutes) => void;
  disabled?: boolean;
}) {
  const at = MINUTE_STOPS.indexOf(minutes);
  const tighter = MINUTE_STOPS[at - 1];
  const looser = MINUTE_STOPS[at + 1];
  return (
    <span className={cn("flex items-center gap-1", disabled && "opacity-40")}>
      <StepButton
        label={`${name}: fewer minutes`}
        disabled={disabled || tighter === undefined}
        onClick={() => tighter !== undefined && onChange(tighter)}
      >
        &minus;
      </StepButton>
      <span className="min-w-[3.25rem] text-center text-[12px]/5 whitespace-nowrap text-ink-body tabular-nums sm:min-w-[5.5rem]">
        <span className="hidden sm:inline">within </span>
        {minutes} min
      </span>
      <StepButton
        label={`${name}: more minutes`}
        disabled={disabled || looser === undefined}
        onClick={() => looser !== undefined && onChange(looser)}
      >
        +
      </StepButton>
    </span>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full border text-[15px]/none transition-colors",
        disabled
          ? "border-hairline text-ink-faint"
          : "border-hairline-strong text-ink hover:border-ink",
      )}
    >
      {children}
    </button>
  );
}
