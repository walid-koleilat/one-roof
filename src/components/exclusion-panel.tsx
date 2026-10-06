import { cn } from "@/lib/utils";

/**
 * The house that failed a filter, kept on screen with the reason.
 *
 * This is the component that keeps the widget honest. Everything else in the
 * result set is a house that passed; without this, a filter silently deletes
 * inventory and the user never learns that her own criteria are what cost her
 * the option. So the panel sits in the row, the same size as a card, and it
 * carries the way back in.
 *
 * `action` is not optional. A reason with no way to override it is a refusal,
 * and the product does not get to refuse on the user's behalf.
 */
export function ExclusionPanel({
  address,
  reason,
  action,
  onAction,
  className,
}: {
  address: string;
  reason: string;
  action: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <aside
      data-slot="exclusion-panel"
      className={cn(
        "flex h-full min-w-0 flex-col gap-2.5 rounded-xl border border-[#F0D2B4] bg-[#FFF6EF] p-5",
        className,
      )}
    >
      <p className="font-mono text-[9px]/3 font-medium tracking-[0.12em] text-conf-low uppercase">
        Left out, and why
      </p>
      <h3 className="text-sm/5 font-semibold text-ink">{address}</h3>
      <p className="grow text-[13px]/5 text-ink-muted">{reason}</p>
      <button
        type="button"
        onClick={onAction}
        className="w-fit text-[13px]/[19px] font-semibold text-action-deep underline-offset-4 hover:underline"
      >
        {action}
      </button>
    </aside>
  );
}
