"use client";

import { cn } from "@/lib/utils";

/**
 * "At least this many", as the stepper everybody knows from the short-let
 * site: a minus, the value, a plus. One reads as Any, because a search that
 * asks for at least one bedroom asks for nothing.
 */
export function RoomStepper<T extends number>({
  name,
  stops,
  value,
  onChange,
}: {
  name: string;
  stops: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  const at = stops.indexOf(value);
  const fewer = stops[at - 1];
  const more = stops[at + 1];
  return (
    <span className="flex items-center gap-1">
      <StepButton
        label={`${name}: fewer`}
        disabled={fewer === undefined}
        onClick={() => fewer !== undefined && onChange(fewer)}
      >
        &minus;
      </StepButton>
      <span className="min-w-[3.25rem] text-center text-[13px]/5 text-ink tabular-nums">
        {value <= 1 ? "Any" : `${value}+`}
      </span>
      <StepButton
        label={`${name}: more`}
        disabled={more === undefined}
        onClick={() => more !== undefined && onChange(more)}
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
        "flex size-8 shrink-0 items-center justify-center rounded-full border text-[16px]/none transition-colors",
        disabled
          ? "border-hairline text-ink-faint"
          : "border-hairline-strong text-ink hover:border-ink",
      )}
    >
      {children}
    </button>
  );
}
