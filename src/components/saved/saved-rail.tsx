"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useSaved } from "@/components/saved/saved-provider";
import { railRows, type SavedList } from "@/lib/domain/saved-view";
import { cn } from "@/lib/utils";

/**
 * One list of lists: everything she saved, the collections she made, the
 * searches still running.
 *
 * It was four sections, each with a heading in small caps and a sentence
 * under the heading explaining what kind of container it held - *Collections
 * you made. They change when you do.* Four headings and four explanations before
 * the first house. The explanations were the tell: a rail that has to
 * describe its own filing system is a filing system that has not earned the
 * screen. They are gone, and so is the fifth kind of row, the stages, which
 * were a filter wearing a list's clothes and are now pills over the grid.
 *
 * What is left is a row, a mark, a name and a count, and the marks still do
 * the work the headings did - a heart for everything she kept, a carton for
 * a collection, a magnifier for something still looking. A search that has found
 * something says so in grey beside its count, never in a coloured badge:
 * "2 new" counts homes that matched, not homes she has not read, and there
 * is no last-visit timestamp anywhere in this product to count against.
 *
 * Nothing here knows a count by heart. Every number is the length of a list
 * `railRows` worked out from the fixture and what she did this session.
 */

/** Where a new search is written. The rail only points at it. */
const NEW_SEARCH_HREF = "/homes-with-a-suite";

/** "Today" is a phrase `WHEN_ORDER` places, the same as every other date here. */
const MADE_ON = "Today";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";

function newLabel(list: SavedList): string | undefined {
  return list.newIds.length > 0 ? `${list.newIds.length} new` : undefined;
}

export function SavedRail() {
  const { state, dispatch, world } = useSaved();
  const rows = useMemo(() => railRows(world, state), [world, state]);

  const isOpen = (list: SavedList): boolean =>
    state.section === list.section && state.openList[list.section] === list.id;

  const open = (list: SavedList) => () =>
    dispatch({ type: "openList", section: list.section, id: list.id });

  return (
    <nav aria-label="Saved lists" className="w-full lg:w-[280px] lg:shrink-0">
      <ul className="hidden flex-col gap-0.5 lg:flex">
        {rows.map((list) => (
          <Row
            key={`${list.section}-${list.id}`}
            list={list}
            selected={isOpen(list)}
            onPress={open(list)}
          />
        ))}
        <li className="mt-1">
          <NewRow />
        </li>
      </ul>

      <MobileRail rows={rows} isOpen={isOpen} open={open} />
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop                                                             */
/* ------------------------------------------------------------------ */

/**
 * One row, three lanes: a 22px mark, the name, and a count on the right.
 * Every row uses the same three, so the counts line up down the whole rail
 * whatever sits in the mark slot.
 */
function Row({
  list,
  selected,
  onPress,
}: {
  list: SavedList;
  selected: boolean;
  onPress: () => void;
}) {
  const isNew = newLabel(list);
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onPress}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] text-left ease-out motion-safe:transition-colors motion-safe:duration-150",
          FOCUS,
          selected ? "bg-action-tint" : "hover:bg-sunken",
        )}
      >
        <span
          aria-hidden
          className="flex w-[22px] shrink-0 items-center justify-center"
        >
          <Mark list={list} selected={selected} />
        </span>
        <span
          className={cn(
            "min-w-0 grow truncate text-[14px]/[20px] text-ink",
            selected ? "font-semibold" : "font-medium",
          )}
        >
          {list.name}
        </span>
        {isNew ? (
          <span className="shrink-0 text-[11px]/[16px] text-ink-muted">
            {isNew}
          </span>
        ) : null}
        <span
          className={cn(
            "w-[22px] shrink-0 text-right text-[13px]/[19px] tabular-nums",
            selected ? "font-semibold text-action-deep" : "text-ink-muted",
          )}
        >
          {list.homeIds.length}
        </span>
      </button>
    </li>
  );
}

function Mark({ list, selected }: { list: SavedList; selected: boolean }) {
  if (list.section === "library") return <HeartMark filled={selected} />;
  if (list.section === "searches") return <SearchMark />;
  return <BoxMark />;
}

/**
 * One row for both. A collection and a search are made in different places -
 * one here, one back on the search page - and two dashed boxes at the bottom
 * of a rail were two invitations where she needed none.
 */
function NewRow() {
  const [making, setMaking] = useState(false);
  const formId = useId();
  const button = useRef<HTMLButtonElement>(null);

  const close = () => {
    setMaking(false);
    button.current?.focus();
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 px-2.5">
        <button
          ref={button}
          type="button"
          aria-expanded={making}
          aria-controls={making ? formId : undefined}
          onClick={() => setMaking((m) => !m)}
          className={cn(
            "rounded-sm py-1 text-[13px]/[19px] font-medium text-ink-muted underline underline-offset-2 ease-out hover:text-ink motion-safe:transition-colors motion-safe:duration-150",
            FOCUS,
          )}
        >
          New collection
        </button>
        <span aria-hidden className="text-[13px]/[19px] text-ink-faint">
          or
        </span>
        <Link
          href={NEW_SEARCH_HREF}
          className={cn(
            "rounded-sm py-1 text-[13px]/[19px] font-medium text-ink-muted underline underline-offset-2 ease-out hover:text-ink motion-safe:transition-colors motion-safe:duration-150",
            FOCUS,
          )}
        >
          new search
        </Link>
      </div>
      {making ? <NewCollectionForm id={formId} onClose={close} /> : null}
    </div>
  );
}

/**
 * The form itself, shared by the rail and the phone. A blank name makes
 * nothing and the form stays open; the reducer refuses an untitled collection, and
 * so does this, rather than closing as if something had been made.
 */
function NewCollectionForm({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { dispatch } = useSaved();
  const [name, setName] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    input.current?.focus();
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed === "") return;
    dispatch({ type: "newCollection", name: trimmed, madeOn: MADE_ON });
    setName("");
    onClose();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <form
      id={id}
      onSubmit={submit}
      onKeyDown={onKeyDown}
      className="flex items-center gap-2 rounded-lg bg-sunken px-2.5 py-2 ease-out motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-250"
    >
      <label htmlFor={inputId} className="sr-only">
        Name for the collection
      </label>
      <input
        ref={input}
        id={inputId}
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name it"
        autoComplete="off"
        className={cn(
          "min-w-0 grow rounded-md bg-transparent text-[13px]/[19px] text-ink outline-none placeholder:text-ink-faint",
          FOCUS,
        )}
      />
      <button
        type="submit"
        className={cn(
          "shrink-0 rounded-full bg-ink px-3 py-1 text-[12px]/[18px] font-semibold text-white",
          FOCUS,
        )}
      >
        Make
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Phone                                                               */
/* ------------------------------------------------------------------ */

const SCROLLER =
  "flex gap-2 overflow-x-auto px-0.5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const CHIP =
  "flex shrink-0 items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-[13px]/[19px] font-medium whitespace-nowrap ease-out motion-safe:transition-colors motion-safe:duration-150 " +
  FOCUS;

/**
 * Below lg the rail is one row of chips, in the same order and the same
 * words. The count rides the first chip only: at 390 the row has to show
 * that it scrolls, and four chips each carrying a number filled the width
 * with digits before the second name was legible.
 */
function MobileRail({
  rows,
  isOpen,
  open,
}: {
  rows: readonly SavedList[];
  isOpen: (list: SavedList) => boolean;
  open: (list: SavedList) => () => void;
}) {
  const [making, setMaking] = useState(false);
  const formId = useId();
  const newButton = useRef<HTMLButtonElement>(null);

  const closeForm = () => {
    setMaking(false);
    newButton.current?.focus();
  };

  return (
    <div className="flex flex-col gap-1 lg:hidden">
      <div role="group" aria-label="Saved lists" className={SCROLLER}>
        {rows.map((list, i) => (
          <button
            key={`${list.section}-${list.id}`}
            type="button"
            aria-pressed={isOpen(list)}
            /*
              The count and the "2 new" reach a screen reader as a label
              rather than a hidden span. A visually hidden span is absolutely
              positioned, so inside a horizontal scroller it escapes the
              clipping and stretches the document to the width of the row -
              750px at a 390px viewport, and a page that scrolls sideways on a
              phone for no visible reason.
            */
            aria-label={`${list.name}, ${list.homeIds.length}${
              newLabel(list) ? `, ${newLabel(list)}` : ""
            }`}
            onClick={open(list)}
            className={cn(
              CHIP,
              isOpen(list)
                ? "border-action bg-action-tint font-semibold text-ink"
                : "border-hairline text-ink-body",
            )}
          >
            {/* "Every home you saved" is a heading on a wide screen and a
                paragraph on a chip. */}
            {list.section === "library" ? "Saved" : list.name}
            {i === 0 ? (
              <span
                aria-hidden
                className={cn(
                  "tabular-nums",
                  isOpen(list) ? "text-action-deep" : "text-ink-muted",
                )}
              >
                {list.homeIds.length}
              </span>
            ) : null}
          </button>
        ))}
        <button
          ref={newButton}
          type="button"
          aria-expanded={making}
          aria-controls={making ? formId : undefined}
          onClick={() => setMaking((m) => !m)}
          className={cn(CHIP, "border-dashed border-hairline-strong text-ink-muted")}
        >
          New collection
        </button>
      </div>

      {making ? (
        <div className="px-0.5">
          <NewCollectionForm id={formId} onClose={closeForm} />
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Marks                                                               */
/* ------------------------------------------------------------------ */

/** The same heart as the save button. Filled blue when the library is open, faint otherwise. */
function HeartMark({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      className={filled ? "text-action" : "text-ink-faint"}
      aria-hidden
    >
      <path
        d="M8 13.6 C8 13.6 1.9 10.1 1.9 6.1 C1.9 4.2 3.4 2.8 5.2 2.8 C6.4 2.8 7.5 3.5 8 4.5 C8.5 3.5 9.6 2.8 10.8 2.8 C12.6 2.8 14.1 4.2 14.1 6.1 C14.1 10.1 8 13.6 8 13.6 Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function BoxMark() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      className="text-ink-faint"
      aria-hidden
    >
      <rect
        x="2"
        y="2.6"
        width="12"
        height="3.2"
        rx="0.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M3.2 5.8 V12.6 A0.9 0.9 0 0 0 4.1 13.5 H11.9 A0.9 0.9 0 0 0 12.8 12.6 V5.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6.3 8.8 H9.7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchMark() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      className="text-ink-faint"
      aria-hidden
    >
      <circle
        cx="7"
        cy="7"
        r="4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M10.2 10.2 L13.6 13.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
