"use client";

import { useEffect } from "react";
import { SHAPE_COLOUR } from "@/components/price-map";
import { ShapeGlyph } from "@/components/search/shape-glyph";
import {
  BATH_STOPS,
  type Baths,
  BED_STOPS,
  type Beds,
  type Ceiling,
  CEILINGS,
  type Minutes,
  type Need,
  type SearchState,
  type Shape,
} from "@/data/counts";
import { RoomStepper } from "@/components/search/room-stepper";
import { MinutesStepper } from "@/components/search/minutes-stepper";
import {
  clearable,
  fitLine,
  NEED_NAME,
  needLabel,
  needRowsFor,
  priceBarsFor,
  routePillsFor,
  SHAPE_ROWS,
  tooFewFor,
} from "@/lib/domain/route-pills";
import { PriceSlider } from "@/components/search/price-slider";
import { cn } from "@/lib/utils";

/**
 * The long tail, and a mirror of what she already said.
 *
 * Step 1 argued that the criteria belong on the surface rather than behind a
 * tap, and that still holds: what she told the chat lives on the sticky bar
 * and is only reflected here. Closing this panel never takes her words away
 * with it, which is the only reason a modal is allowed on this page at all.
 *
 * The shell is the one everybody already knows from the short-let site: a
 * centred title, an X, big plain section headings, rows with switches, and a
 * footer with Clear all on the left and the count on the button. Nothing in
 * that shape is ours, and nothing in it needs to be. What is ours is what
 * the sections say.
 *
 * It is one list, the way the short-let site's is, and it holds only the
 * typical filters: what the conversation put on the page sits on the bar,
 * under its own eyebrow, and is not repeated here. Every row is the same
 * shape, a mark, a name, the count it leaves and its control, so a reader
 * scans one column of numbers rather than four kinds of widget.
 *
 * How far is near is a stepper over five declared stops, because the count
 * table has a cost at each stop and nothing in between: a slider that could
 * rest on twelve minutes would be reporting a number nobody declared.
 *
 * Price is a ceiling and nothing else. The slider snaps to the ceilings the
 * search bar already offers, and the bars above it are the count each one
 * leaves, so the histogram is the same table drawn rather than a second
 * source. There is no minimum, because nothing is modelled under the cheapest
 * home on the page, and drawing a dead control would be worse than one line
 * saying so.
 *
 * Everything in here recounts live. Nothing is staged and there is no Cancel,
 * because there is nothing to cancel: Escape closes the panel and keeps what
 * she changed, the same as pressing the button. When the count falls under
 * `TOO_FEW` the panel does not close to say so; it names the requirement
 * that cost the most and offers to drop it, above the button, where she is.
 *
 * Bedrooms and bathrooms are real: every listing carries its rooms, the
 * sample filters on them, and the market count moves by declared costs.
 * What is deliberately absent is property type, parking, a side entrance,
 * days on market and open houses. The prototype has no data behind them,
 * and a control that looks like a filter and filters nothing is worse than
 * an honest gap, which is said here out loud rather than left for someone to
 * discover.
 */

export type { Need };

export interface Rooms {
  beds: Beds;
  baths: Baths;
}

export interface Afford {
  address: string;
  /** What her semi is worth. */
  semi: number;
  /** What that leaves for the next house, which is one of the declared ceilings. */
  ceiling: number;
}

/** A figure is a ceiling only if the table has a row for it; otherwise it is no ceiling. */
function asCeiling(value: number): Ceiling | null {
  return (CEILINGS as readonly number[]).includes(value) ? (value as Ceiling) : null;
}

/** The dot beside each row, in the colour the map draws that layer in. */
const LAYER_DOT: Record<Need, string> = {
  nearHospital: "bg-layer-health",
  nearTransit: "bg-layer-transit",
  nearTemple: "bg-layer-worship",
  nearGrocery: "bg-layer-grocery",
};

export function FilterModal({
  state,
  minutes,
  onMinutes,
  rooms,
  onRooms,
  chatRooms,
  afford,
  count,
  settled,
  onToggleShape,
  onToggleNeed,
  onCeiling,
  onFloor,
  onClearAll,
  onClose,
  onOpenValuation,
}: {
  state: SearchState;
  /** How far each requirement reaches, and where she moves it. */
  minutes: Record<Need, Minutes>;
  onMinutes: (need: Need, minutes: Minutes) => void;
  /** At least this many bedrooms and bathrooms. One is any. */
  rooms: Rooms;
  onRooms: (rooms: Rooms) => void;
  /** What the conversation set the rooms to, or null when there was none. */
  chatRooms: Rooms | null;
  /** What her semi is worth and what that leaves, once the steps are walked. Null before. */
  afford: Afford | null;
  /** Null while it is being worked out. */
  count: number | null;
  settled: boolean;
  onToggleShape: (shape: Shape) => void;
  onToggleNeed: (need: Need) => void;
  /**
   * A new ceiling, or null to take it off. The slider's stops are the declared
   * `CEILINGS` and nothing in between, because the count table has a row for
   * each of those and for nothing else.
   */
  onCeiling: (ceiling: Ceiling | null) => void;
  /** A minimum, as one of the declared stops, or null for none. */
  onFloor: (floor: Ceiling | null) => void;
  onClearAll: () => void;
  onClose: () => void;
  onOpenValuation: () => void;
}) {
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [onClose]);

  const pills = routePillsFor(state);
  const rows = needRowsFor(state);
  const bars = priceBarsFor(state);
  const tooFew = tooFewFor(state, minutes);
  const canClear = clearable(state);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Filters"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 sm:items-center sm:p-6"
    >
      <div className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-background sm:h-auto sm:max-h-[90vh] sm:max-w-[780px] sm:rounded-[32px] sm:border sm:border-hairline-strong sm:shadow-[0_16px_44px_rgba(22,24,26,0.14)]">
        <header className="relative flex shrink-0 items-center justify-center border-b border-hairline px-6 py-[18px]">
          <h2 className="text-base/6 font-semibold text-ink">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-1/2 right-4 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-prose hover:bg-sunken"
          >
            <CloseIcon />
            <span className="sr-only">Close filters</span>
          </button>
        </header>

        <div className="grow overflow-x-hidden overflow-y-auto">
          <Section>
            <Heading>How everyone fits</Heading>
            {pills.map((pill) => {
              const row = SHAPE_ROWS[pill.shape];
              return (
                <button
                  key={pill.shape}
                  type="button"
                  aria-pressed={pill.active}
                  onClick={() => onToggleShape(pill.shape)}
                  className={cn(
                    "flex items-center gap-3.5 rounded-xl border px-3.5 py-3 text-left transition-colors",
                    pill.active
                      ? "border-ink bg-background"
                      : "border-hairline hover:border-hairline-strong",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-lg border",
                      pill.active ? "border-hairline-strong bg-background" : "border-hairline bg-sunken",
                    )}
                  >
                    <ShapeGlyph
                      shape={pill.shape}
                      size={24}
                      colour={pill.active ? SHAPE_COLOUR[pill.shape] : "var(--ds-ink-faint)"}
                    />
                  </span>
                  <span className="flex grow flex-col gap-px">
                    <span className="text-sm/[21px] font-medium text-ink">
                      {row.title}
                    </span>
                    <span className="text-[12px]/[19px] text-ink-prose">
                      {row.detail}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-sm/[21px] font-semibold",
                      pill.active ? "text-ink" : "text-ink-muted",
                    )}
                  >
                    {pill.active ? pill.delta : `+${pill.delta}`}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "size-[18px] shrink-0 rounded-sm",
                      pill.active ? "bg-ink" : "border border-hairline-strong",
                    )}
                  />
                </button>
              );
            })}
            <p className="text-[12px]/[19px] text-ink-muted">
              {fitLine(count, pills)}
            </p>
          </Section>

          <Section>
            <div className="flex flex-col gap-1">
              <Heading>Price</Heading>
              <p className="text-[13px]/5 text-ink-body">
                Asking price. The bars are the homes in each bracket, spread within it.
              </p>
            </div>
            <PriceSlider
              bars={bars}
              floor={state.floor ?? null}
              onPick={onCeiling}
              onFloor={onFloor}
              afford={afford ? { address: afford.address, ceiling: afford.ceiling } : null}
              onUseAfford={afford ? () => onCeiling(asCeiling(afford.ceiling)) : undefined}
            />
            {afford ? null : (
              /* The way to a ceiling that is not a guess: an invitation, not a footnote. */
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-hairline bg-sunken px-4 py-3">
                <button
                  type="button"
                  onClick={onOpenValuation}
                  className="flex min-h-9 items-center gap-2 rounded-full border-[1.5px] border-ink bg-background px-4 py-1.5 text-[13px]/5 font-medium text-ink transition-colors hover:bg-sunken sm:min-h-0"
                >
                  <HouseIcon />
                  Find out what your current house is worth
                </button>
                <span className="text-[12px]/[19px] text-ink-body">
                  One address, and this stops being a guess.
                </span>
              </div>
            )}
          </Section>

          <Section>
            <Heading>Rooms</Heading>
            <ul className="flex flex-col">
              <li className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm/5 text-ink">Bedrooms</span>
                  {chatRooms && rooms.beds === chatRooms.beds ? <FromChat /> : null}
                </span>
                <RoomStepper
                  name="Bedrooms"
                  stops={BED_STOPS}
                  value={rooms.beds}
                  onChange={(beds) => onRooms({ ...rooms, beds })}
                />
              </li>
              <li className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm/5 text-ink">Bathrooms</span>
                  {chatRooms && rooms.baths === chatRooms.baths ? <FromChat /> : null}
                </span>
                <RoomStepper
                  name="Bathrooms"
                  stops={BATH_STOPS}
                  value={rooms.baths}
                  onChange={(baths) => onRooms({ ...rooms, baths })}
                />
              </li>
            </ul>
            <p className="text-[12px]/[19px] text-ink-muted">
              {chatRooms
                ? "Five of you, the conversation said: a bedroom and a bath for your parents, three bedrooms and a bath of your own. Every home here has that already."
                : "At least this many. The suite\u2019s own rooms count."}
            </p>
          </Section>

          <Section>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <Heading>Travel time</Heading>
              <span className="grow" />
              <span className="text-[11px]/[17px] text-ink-muted">
                Nearby, on the map, draws these. Here they narrow the list.
              </span>
            </div>
            <ul className="flex flex-col">
              {rows.map((row) => {
                const label = needLabel(row.need, minutes);
                return (
                  <li key={row.need}>
                    <Row
                      mark={LAYER_DOT[row.need]}
                      label={NEED_NAME[row.need]}
                      count={row.withOn}
                      on={row.on}
                    >
                      <MinutesStepper
                        name={NEED_NAME[row.need]}
                        minutes={minutes[row.need]}
                        disabled={!row.on}
                        onChange={(next) => onMinutes(row.need, next)}
                      />
                      <Switch
                        on={row.on}
                        label={label}
                        onToggle={() => onToggleNeed(row.need)}
                      />
                    </Row>
                  </li>
                );
              })}
            </ul>
            <p className="text-[12px]/[19px] text-ink-muted">
              The same four as Places on the bar. Move one here and it moves
              there.
            </p>
          </Section>

          <Section>
            <Heading>Not in this prototype</Heading>
            <p className="text-[12px]/[19px] text-ink-muted">
              Property type, parking, a separate side entrance, listed in the
              last 14 days and open house this weekend. There is no data behind
              any of them here, and a control that looks like a filter and
              filters nothing is worse than saying so.
            </p>
          </Section>
        </div>

        {tooFew ? (
          <div
            role="status"
            className="flex shrink-0 flex-col gap-3 border-t border-hairline bg-warm-tint px-6 py-4 sm:flex-row sm:items-start"
          >
            <p className="text-sm/[22px] text-ink-body sm:max-w-[420px]">
              {tooFew.sentence}
            </p>
            <span className="grow" />
            <button
              type="button"
              onClick={() => onToggleNeed(tooFew.need)}
              className="self-start rounded-full border border-hairline-strong bg-background px-[15px] py-2 text-[13px]/5 font-medium whitespace-nowrap text-ink hover:border-ink-faint"
            >
              {tooFew.button}
            </button>
          </div>
        ) : null}

        <footer className="flex shrink-0 items-center gap-4 border-t border-hairline px-6 py-4">
          <button
            type="button"
            onClick={onClearAll}
            disabled={!canClear}
            className={cn(
              "text-[13px]/5 font-medium underline underline-offset-2 transition-colors",
              canClear ? "text-ink" : "text-ink-faint",
            )}
          >
            Clear all
          </button>
          <span className="grow" />
          <button
            type="button"
            onClick={onClose}
            disabled={!settled}
            className={cn(
              "min-w-[9.5rem] rounded-md px-[22px] py-[11px] text-sm/[21px] font-medium text-white transition-colors",
              settled ? "bg-action" : "bg-ink-faint",
            )}
          >
            {count === null
              ? "Counting"
              : `Show ${count} ${count === 1 ? "home" : "homes"}`}
          </button>
        </footer>
      </div>
    </div>
  );
}

/** One section: heading, controls, and a line saying what they do. */
function Section({
  tint,
  children,
}: {
  /** The mirror of what she said sits on the action tint, the long tail on white. */
  tint?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 border-b border-hairline px-6 pt-6 pb-7 last:border-b-0 sm:px-8",
        tint ? "bg-action-tint" : null,
      )}
    >
      {children}
    </section>
  );
}

/** The eyebrow the bar uses, beside a value the conversation set. */
function FromChat() {
  return (
    <span className="font-mono text-[10px]/3 font-medium tracking-[0.09em] text-ink-muted uppercase">
      <span className="sm:hidden">From your chat</span>
      <span className="hidden sm:inline">From your ChatGPT conversation</span>
    </span>
  );
}

function Heading({
  eyebrow,
  children,
}: {
  /** The chat's section is captioned rather than titled: it is a source, not a filter. */
  eyebrow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <h3
      className={cn(
        eyebrow
          ? "font-mono text-[10px]/3 font-medium tracking-[0.09em] text-flag uppercase"
          : "text-[22px]/[28px] font-semibold text-ink",
      )}
    >
      {children}
    </h3>
  );
}

/**
 * One filter, as a line in the list.
 *
 * Every section reads the same way: a mark, the name, the count it leaves,
 * the control. The name is a button only where there is a sentence behind
 * it, and then it is dotted-underlined the way the context panel underlines
 * her clauses, so the same mark means the same thing in both places.
 * The count is what she has with this one on, so a row that is off reads
 * as what turning it on would leave.
 */
function Row({
  mark,
  label,
  count,
  on,
  children,
}: {
  mark: string;
  label: string;
  count: number;
  on: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2 py-2">
      <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", mark)} />
      <span className={cn("w-[72px] text-sm/5", on ? "text-ink" : "text-ink-body")}>
        {label}
      </span>
      <span className="grow" />
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "text-[12px]/5 font-semibold tabular-nums",
            on ? "text-ink" : "text-ink-muted",
          )}
        >
          {count}
        </span>
        {children}
      </span>
    </div>
  );
}

function Switch({
  on,
  label,
  onToggle,
}: {
  on: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "relative h-[19px] w-[34px] shrink-0 rounded-full transition-colors duration-150",
        on ? "bg-ink" : "bg-hairline",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-[2px] left-0 size-[15px] rounded-full bg-background transition-transform duration-150",
          on ? "translate-x-[17px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );
}

function HouseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 7.4L8 2.6L13.5 7.4V13.4H2.5V7.4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M6.5 13.4V9.4H9.5V13.4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M1.5 1.5L12.5 12.5M12.5 1.5L1.5 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
