"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { type Ceiling, CEILINGS, type Shape } from "@/data/counts";
import { PriceSlider } from "@/components/search/price-slider";
import type { PriceBar } from "@/lib/domain/route-pills";
import { formatCurrency, formatCurrencyCompact } from "@/lib/domain/format";
import { cn } from "@/lib/utils";

/**
 * Three things she can change, each opening where it stands.
 *
 * The panels are popovers over the page rather than an expanding bar, because
 * an expanding bar shoves the map and the homes down the screen and she loses
 * the thing she was comparing against. What she is doing here is adjusting a
 * search she can already see the results of, so the results must not move.
 *
 * The bar borrows the grammar of the one everybody already knows how to use:
 * when a field is open the bar goes quiet and grey and the field she pressed
 * lifts off it in white, so the eye lands on the one thing being edited. The
 * last field lifts together with the Search button, as one piece. Where is a
 * field she can type into, and the list under it narrows as she types, with
 * the letters she typed shown in bold. The three routes are not a field here;
 * they live on the bar below, where their counts are.
 *
 * Every choice carries the number it would give. The count moves before she
 * chooses, not after, and it is the same table the bar reads.
 */

export type Segment = "looking" | "where" | "budget";

export interface SearchValue {
  looking: string;
  where: string;
  budget: number | null;
  /** The minimum, as one of the declared stops, or null for none. */
  floor: Ceiling | null;
  shapes: readonly Shape[];
}

/** What a choice in a panel would do to the search, for the count beside it. */
export interface SearchProbe {
  where?: string;
  budget?: number | null;
}

export const AREAS = [
  "Bendale",
  "Woburn",
  "Cliffcrest",
  "West Hill",
  "All of Scarborough",
] as const;

const LOOKING: readonly { label: string; sub: string }[] = [
  {
    label: "A multigenerational home",
    sub: "Room for two households under one roof",
  },
  { label: "A home with a second kitchen", sub: "Her own kitchen, her own door" },
  { label: "A bungalow, any size", sub: "One level, no stairs" },
];

const SEGMENTS: readonly Segment[] = ["looking", "where", "budget"];

export function budgetLabel(budget: number | null, floor: number | null = null): string {
  if (floor && budget) return `${formatCurrencyCompact(floor)} to ${formatCurrencyCompact(budget)}`;
  if (floor) return `From ${formatCurrency(floor)}`;
  return budget ? `Under ${formatCurrency(budget)}` : "No ceiling";
}

/**
 * What the field says. "No ceiling" is a choice in the panel; in the field a
 * missing budget reads as what it is - nothing set - because on the cold
 * arrival nobody chose to have no ceiling.
 */
export function budgetField(budget: number | null, floor: number | null = null): string {
  if (floor) return budgetLabel(budget, floor);
  return budget ? `Under ${formatCurrency(budget)}` : "Not set";
}

export function SearchBar({
  value,
  onChange,
  count,
  total,
  countWith,
  onSearch,
  autoFocus,
}: {
  value: SearchValue;
  onChange: (next: SearchValue) => void;
  /** How many homes the current settings find. */
  count: number;
  /** How many there are in the area at all. */
  total: number;
  /** The count a choice would give, from the same table the bar reads. */
  countWith: (probe: SearchProbe) => number;
  /** The search is live, so the button takes her to what it found. */
  onSearch?: () => void;
  /** Open on the Where field straight away, when the bar was summoned. */
  autoFocus?: boolean;
}) {
  const [open, setOpen] = useState<Segment | null>(autoFocus ? "where" : null);
  const [hover, setHover] = useState<Segment | null>(null);
  const [query, setQuery] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const whereInput = useRef<HTMLInputElement>(null);
  const segs = useRef(new Map<Segment, HTMLElement | null>());
  const [panelLeft, setPanelLeft] = useState(0);

  useLayoutEffect(() => {
    if (!open) return;
    const seg = segs.current.get(open);
    const bar = box.current;
    if (!seg || !bar) return;
    const width = Math.min(420, bar.clientWidth);
    setPanelLeft(Math.max(0, Math.min(seg.offsetLeft, bar.clientWidth - width)));
  }, [open]);

  useEffect(() => {
    if (open === "where") {
      whereInput.current?.focus();
      return;
    }
    // Leaving Where forgets what was typed but not chosen. Deferred a tick,
    // so a state change is never made synchronously inside an effect.
    const id = window.setTimeout(() => setQuery(""), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function away(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(null);
    }
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const lit = open ?? hover;
  const dividerHidden = (after: Segment) => {
    const i = SEGMENTS.indexOf(after);
    return lit === after || lit === SEGMENTS[i + 1];
  };

  const priceStops = [...CEILINGS, null].map((ceiling) => ({
    ceiling,
    label: ceiling === null ? "No ceiling" : formatCurrency(ceiling),
    count: countWith({ budget: ceiling }),
    selected: ceiling === value.budget,
  }));
  const tallest = Math.max(1, ...priceStops.map((stop) => stop.count));
  const priceBars: readonly PriceBar[] = priceStops.map((stop) => ({
    ...stop,
    share: Math.max(0, stop.count) / tallest,
  }));

  const q = query.trim().toLowerCase();
  const matches = q
    ? AREAS.filter((a) => a.toLowerCase().includes(q))
    : [...AREAS];
  const pickWhere = (where: string) => {
    onChange({ ...value, where });
    setQuery("");
    setOpen(null);
  };

  return (
    <div ref={box} className="relative">
      <div
        className={cn(
          // No inset on a wide screen: a hovered field fills the bar's
          // height, the way the bar everybody knows tints it. The button
          // keeps a small inset of its own.
          "flex flex-col gap-1 rounded-[28px] border bg-background p-1.5 transition-[background-color,border-color,box-shadow] duration-200 sm:flex-row sm:items-center sm:rounded-full sm:p-0 sm:pr-2",
          open
            ? "border-transparent bg-sunken shadow-none"
            : "border-hairline shadow-[0_3px_12px_rgba(22,24,26,0.12)] hover:shadow-[0_4px_16px_rgba(22,24,26,0.18)]",
        )}
      >
        <Seg
          id="looking"
          label="I am looking for"
          icon={<HouseIcon />}
          lifted={open === "looking"}
          onOpen={() => setOpen(open === "looking" ? null : "looking")}
          setHover={setHover}
          register={(el) => segs.current.set("looking", el)}
        >
          <span className="truncate text-sm/5 font-medium text-ink">{value.looking}</span>
        </Seg>
        <Rule hidden={dividerHidden("looking")} />
        <Seg
          id="where"
          label="Where"
          icon={<PinIcon />}
          lifted={open === "where"}
          onOpen={() => setOpen("where")}
          setHover={setHover}
          register={(el) => segs.current.set("where", el)}
        >
          <span className="flex items-center gap-2">
            <input
              ref={whereInput}
              value={open === "where" ? query : value.where}
              placeholder={open === "where" ? value.where : "Anywhere in Scarborough"}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen("where")}
              onKeyDown={(e) => {
                if (e.key === "Enter" && matches[0]) pickWhere(matches[0]);
              }}
              aria-label="Where"
              aria-autocomplete="list"
              className="w-full min-w-0 bg-transparent text-sm/5 font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-faint"
            />
            {open === "where" && query ? (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setQuery("")}
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sunken text-ink hover:bg-hairline"
              >
                <CloseIcon />
                <span className="sr-only">Clear</span>
              </button>
            ) : null}
          </span>
        </Seg>
        <Rule hidden={dividerHidden("where")} />
        {/*
          The last field and the button lift together. On the bar everybody
          knows, that is how the far end reads as one piece rather than as a
          field with a button stuck to it.
        */}
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center rounded-full transition-[background-color,box-shadow] duration-150",
            // The tint on hover covers the field and the button together,
            // because that is the piece she is about to press.
            open === "budget"
              ? "bg-background shadow-[0_6px_20px_rgba(22,24,26,0.16)]"
              : "hover:bg-hairline",
          )}
        >
          <Seg
            id="budget"
            label="Budget"
            icon={<TagIcon />}
            lifted={false}
            plain
            onOpen={() => setOpen(open === "budget" ? null : "budget")}
            setHover={setHover}
            register={(el) => segs.current.set("budget", el)}
          >
            <span className="truncate text-sm/5 font-medium text-ink">
              {budgetField(value.budget, value.floor)}
            </span>
          </Seg>
          <button
            type="button"
            onClick={() => {
              setOpen(null);
              onSearch?.();
            }}
            className="mr-0 flex shrink-0 items-center justify-center gap-2 rounded-full bg-action py-3 pr-5 pl-4 text-[14px]/[21px] font-semibold text-white transition-colors hover:bg-action-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
          >
            <SearchIcon />
            Search
          </button>
        </div>
      </div>

      {open ? (
        <Panel
          onDone={() => setOpen(null)}
          count={count}
          total={total}
          left={panelLeft}
        >
          {open === "looking" ? (
            <Choices
              icon={<HouseIcon />}
              rows={LOOKING.map((o) => ({
                key: o.label,
                title: o.label,
                sub: o.sub,
                picked: o.label === value.looking,
              }))}
              onPick={(looking) => {
                onChange({ ...value, looking });
                setOpen(null);
              }}
            />
          ) : null}

          {open === "where" ? (
            q ? (
              <Choices
                icon={<PinIcon />}
                rows={matches.map((a) => ({
                  key: a,
                  title: <Highlight text={a} query={query} />,
                  sub: `${countWith({ where: a })} homes`,
                  picked: a === value.where,
                }))}
                empty="Nothing in Scarborough is called that."
                onPick={pickWhere}
              />
            ) : (
              <>
                <Group>From your chat</Group>
                <Choices
                  icon={<PinIcon />}
                  tint
                  rows={[
                    {
                      key: "Bendale",
                      title: "Bendale",
                      sub: `Near you · ${countWith({ where: "Bendale" })} homes`,
                      picked: value.where === "Bendale",
                    },
                  ]}
                  onPick={pickWhere}
                />
                <Group>Also in Scarborough</Group>
                <Choices
                  icon={<PinIcon />}
                  rows={AREAS.filter((a) => a !== "Bendale").map((a) => ({
                    key: a,
                    title: a,
                    sub: `${countWith({ where: a })} homes`,
                    picked: a === value.where,
                  }))}
                  onPick={pickWhere}
                />
              </>
            )
          ) : null}

          {open === "budget" ? (
            /*
              The same slider Filters has, over the same five stops, so the
              ceiling reads the same way wherever she sets it. Its bars are
              the counts this bar already prices each choice with.
            */
            <div className="px-2 pt-1 pb-2">
              <PriceSlider
                bars={priceBars}
                floor={value.floor}
                onPick={(budget) => onChange({ ...value, budget })}
                onFloor={(floor) => onChange({ ...value, floor })}
              />
            </div>
          ) : null}
        </Panel>
      ) : null}
    </div>
  );
}

function Seg({
  id,
  label,
  icon,
  lifted,
  onOpen,
  setHover,
  register,
  children,
  plain = false,
}: {
  id: Segment;
  label: string;
  icon: React.ReactNode;
  lifted: boolean;
  onOpen: () => void;
  setHover: (next: Segment | null) => void;
  register: (el: HTMLElement | null) => void;
  children: React.ReactNode;
  /** Leaves the hover tint to the wrapper, for the field that shares its pill with the button. */
  plain?: boolean;
}) {
  return (
    <div
      ref={register}
      role="button"
      tabIndex={0}
      aria-expanded={lifted}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      onMouseEnter={() => setHover(id)}
      onMouseLeave={() => setHover(null)}
      className={cn(
        // The ring sits inside the field: the last field shares its pill
        // with the Search button, and a ring outside it ran under the button.
        "flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-full py-2.5 pr-5 pl-5 text-left transition-[background-color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-action sm:py-3.5 sm:pr-6 sm:pl-6",
        lifted
          ? "bg-background shadow-[0_6px_20px_rgba(22,24,26,0.16)]"
          : plain
            ? null
            : "hover:bg-hairline",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          lifted ? "bg-action-tint text-action-deep" : "bg-sunken text-ink-muted",
        )}
      >
        {icon}
      </span>
      <span className="flex min-w-0 grow flex-col gap-px">
        <span className="text-[12px]/4 font-semibold text-ink">{label}</span>
        {children}
      </span>
    </div>
  );
}

function Rule({ hidden }: { hidden: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "hidden h-[34px] w-px shrink-0 bg-hairline transition-opacity duration-150 sm:block",
        hidden && "opacity-0",
      )}
    />
  );
}

function Panel({
  children,
  onDone,
  count,
  total,
  left,
}: {
  children: React.ReactNode;
  onDone: () => void;
  count: number;
  total: number;
  left: number;
}) {
  return (
    <div
      style={{ left }}
      className="absolute top-full z-40 mt-3 w-full max-w-[420px] rounded-[28px] border border-hairline bg-background px-4 pt-4 pb-3 shadow-[0_8px_28px_rgba(22,24,26,0.18)]"
    >
      {children}
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-hairline px-2 pt-3">
        <p aria-live="polite" className="text-[13px]/5 text-ink-muted">
          <span className="font-semibold text-ink">{count}</span> of {total}{" "}
          homes
        </p>
        <button
          type="button"
          onClick={onDone}
          className="rounded-full bg-ink px-4 py-2 text-[13px]/5 font-semibold text-white transition-colors hover:bg-ink/90"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 pt-2 pb-1 text-[13px]/5 font-medium text-ink-muted">
      {children}
    </p>
  );
}

/**
 * The choices, each with the field's own mark in a quiet tile beside it and
 * the number it would give underneath. The one she has now carries the tick.
 */
function Choices({
  icon,
  rows,
  tint,
  empty,
  onPick,
}: {
  icon: React.ReactNode;
  rows: readonly {
    key: string;
    title: React.ReactNode;
    sub: string;
    picked: boolean;
  }[];
  /** The tile takes the brand tint: this choice came from her, not from us. */
  tint?: boolean;
  empty?: string;
  onPick: (key: string) => void;
}) {
  if (rows.length === 0) {
    return <p className="px-2 py-3 text-sm/5 text-ink-muted">{empty}</p>;
  }
  return (
    <ul role="listbox" className="flex flex-col">
      {rows.map((row) => (
        <li key={row.key}>
          <button
            type="button"
            role="option"
            aria-selected={row.picked}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(row.key)}
            className="flex w-full items-center gap-3.5 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-sunken"
          >
            <span
              aria-hidden
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl",
                row.picked || tint
                  ? "bg-action-tint text-action-deep"
                  : "bg-sunken text-ink-muted",
              )}
            >
              {icon}
            </span>
            <span className="flex min-w-0 grow flex-col">
              <span
                className={cn(
                  "truncate text-[15px]/[22px] text-ink",
                  row.picked && "font-semibold",
                )}
              >
                {row.title}
              </span>
              <span className="text-[13px]/5 text-ink-muted">{row.sub}</span>
            </span>
            {row.picked ? <Tick /> : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** The letters she typed, in bold, wherever they fall in the name. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const at = text.toLowerCase().indexOf(q.toLowerCase());
  if (!q || at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <b className="font-semibold">{text.slice(at, at + q.length)}</b>
      {text.slice(at + q.length)}
    </>
  );
}

function Tick() {
  return (
    <svg width="14" height="11" viewBox="0 0 13 10" fill="none" aria-hidden>
      <path
        d="M1 5L4.6 8.6L12 1.2"
        stroke="var(--ds-action-deep)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HouseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 7.5L8 2.5l5.5 5M4 6.5v6.5h3.2V9.5h1.6V13H12V6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 14s4.5-4.2 4.5-7.5a4.5 4.5 0 1 0-9 0C3.5 9.8 8 14 8 14Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.5" r="1.6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function TagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 8.2V3.5a1 1 0 0 1 1-1h4.7a1 1 0 0 1 .7.3l5.4 5.4a1 1 0 0 1 0 1.4l-4.7 4.7a1 1 0 0 1-1.4 0L2.8 8.9a1 1 0 0 1-.3-.7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="5.6" cy="5.6" r="1" fill="currentColor" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M10.5 10.5L14 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
      <path
        d="M1 1L8 8M8 1L1 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
