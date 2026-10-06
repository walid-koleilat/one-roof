"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccountProvider,
  useAccount,
} from "@/components/account/account-provider";
import { SaveButton } from "@/components/account/save-button";
import { Exit, ExitHintBanner, ExitHintProvider } from "@/components/exit-hint";
import { ListingCard } from "@/components/listing-card";
import {
  PriceMap,
  type PlaceKind,
  SHAPE_LABEL,
} from "@/components/price-map";
import { CompactSearch } from "@/components/search/compact-search";
import {
  budgetLabel,
  SearchBar,
  type SearchProbe,
  type SearchValue,
} from "@/components/search/search-bar";
import { ExpandedView } from "@/components/search/expanded-view";
import { FilterModal, type Rooms } from "@/components/search/filter-modal";
import { SAMPLE_ADDRESS, SEMI_WORKED } from "@/data/semi-bracket";
import { AgentsSection } from "@/components/agents-section";
import { BudgetBlock } from "@/components/arrival/budget-block";
import { ContextPanel } from "@/components/search/context-panel";
import { MapPopover } from "@/components/search/map-popover";
import { MapZoom, ZOOM_STEP } from "@/components/search/map-zoom";
import { NudgeBar } from "@/components/search/nudge-bar";
import { PlacesDrawer } from "@/components/search/places-drawer";
import { SearchActions } from "@/components/search/search-actions";
import { ShapeGlyph } from "@/components/search/shape-glyph";
import { StickyBar, type View } from "@/components/search/sticky-bar";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { PhoneFrame } from "@/components/site/phone-frame";
import { StateSwitch, type Device } from "@/components/site/state-switch";
import {
  BENDALE_HOMES,
  CEILINGS,
  countFor,
  listingsFor,
  NEEDS,
  SEARCH,
  type Ceiling,
  type Need,
  type Shape,
  BASE_MINUTES,
  type Minutes,
  CHAT_ROOMS,
} from "@/data/counts";
import type { SearchPatch } from "@/data/context";
import { LISTINGS } from "@/data/listings";
import { spelledOut } from "@/lib/domain/format";
import { mattersFor } from "@/lib/domain/matters";
import {
  pinsFor,
  SEARCH_BOUNDARY,
  SEARCH_LABELS,
  SEARCH_MAP_CANVAS,
  insideBoundary,
  SEARCH_PLACES,
} from "@/data/search-map";
import type { Thresholds } from "@/lib/domain/matters";
import {
  needLabel,
  totalFor,
} from "@/lib/domain/route-pills";
import { cn } from "@/lib/utils";
import { SHAPES } from "@/components/arrival/shape-cards";

/**
 * The search page, and the one door into Saved.
 *
 * What this screen has to answer is whether she can change her mind without
 * starting over. So every part of the search opens where it stands, the count
 * moves before she commits to anything, and the map and the list are two views
 * of one set rather than two lists that happen to agree.
 *
 * Nothing here is gated. Thirty-one homes, every price and every permit line,
 * with no account. The only thing that asks anything is Save, and Save is the
 * door into J4 - which is why the line under the heading says plainly that
 * nothing on the page is hers until she presses it.
 */

/**
 * What she told the chat, short enough to sit on one line of the sticky bar.
 *
 * Assembled from the lines she actually typed in `conversation.ts` rather than
 * written fresh. A chip labelled "from your chat" has to trace to something
 * she said, or the label is a lie.
 */
/*
  Two clauses, not three.

  The bar has to hold her words, four route and filter controls, a count, a
  three-way toggle and two icons on one line, and the third clause is what
  pushed it onto a second. Nothing is lost: pressing the pill opens the full
  sentences, which is where the rest of them live and where editing belongs.
*/
const SUMMARY = "no stairs \u00b7 own kitchen";

const PLACES: readonly { kind: PlaceKind; label: string }[] = [
  { kind: "health", label: "Hospital" },
  { kind: "transit", label: "Transit" },
  { kind: "grocery", label: "Grocery" },
  { kind: "worship", label: "Worship" },
  { kind: "parks", label: "Parks" },
];

/** A budget the bar chose is one of the declared ceilings, or nothing. */
function asCeiling(budget: number | null): Ceiling | undefined {
  return (CEILINGS as readonly number[]).includes(budget ?? -1)
    ? (budget as Ceiling)
    : undefined;
}

/** Rooms at "any", which is what a search with no conversation behind it asks. */
const NO_ROOMS: Rooms = { beds: 1, baths: 1 };

/**
 * Everything the conversation set, or its absence.
 *
 * The switch in the corner and the address both arrive here, so a page opened
 * at `?context=off` is the page the switch makes, not an approximation of it.
 * Worship is on the map because she named a temple; nobody named one on the
 * cold arrival, so the layer goes with the conversation rather than staying
 * on as a default nobody asked for. Health and transit stay: they are the
 * two a search page can defend without being told anything. The area is hers,
 * drawn around the neighbourhood she named; with nothing declared there is no
 * area to be on, and a boundary around Scarborough would be a line around the
 * whole search.
 */
function fromContext(on: boolean) {
  return {
    looking: on ? "A multigenerational home" : "Any kind of home",
    where: on ? SEARCH.where : "All of Scarborough",
    budget: on ? SEARCH.budget : null,
    places: (on
      ? ["health", "transit", "worship"]
      : ["health", "transit"]) as readonly PlaceKind[],
    rooms: on ? CHAT_ROOMS : NO_ROOMS,
    needs: {
      nearHospital: on,
      nearTransit: on,
      nearTemple: false,
      nearGrocery: false,
    } satisfies Record<Need, boolean>,
    drawn: on,
  };
}

export default function SearchPage() {
  /*
    Signed out, with the chat behind her. That is the state the whole page
    argues about, and starting it signed in conceded the argument before a
    reviewer had read a line of it. The address can say otherwise, which is
    how the phone frame shows the state the switches are set to.
  */
  const params = useSearchParams();
  const startContext = params.get("context") !== "off";
  const startSignedIn = params.get("account") === "in";
  const framed = params.get("frame") === "phone";
  return (
    <AccountProvider startSignedIn={startSignedIn}>
      <Search startContext={startContext} framed={framed} />
    </AccountProvider>
  );
}

function Search({
  startContext,
  framed,
}: {
  startContext: boolean;
  /** Inside the phone frame, where the scaffolding would be a frame within a frame. */
  framed: boolean;
}) {
  const account = useAccount();
  const start = fromContext(startContext);
  const [value, setValue] = useState<SearchValue>({
    looking: start.looking,
    where: start.where,
    budget: start.budget,
    floor: null,
    shapes: ["suite", "ground"],
  });
  /**
   * Worship is on by default because she asked for it.
   *
   * "the temple if we can" is in her second message, and the front door
   * promises this map puts the temple next to each home. Leaving the layer off
   * made her say it twice.
   */
  const [places, setPlaces] = useState<readonly PlaceKind[]>(start.places);
  const [view, setView] = useState<View>("both");
  /**
   * The view the layout has finished arriving at.
   *
   * The map column animates its width over 300ms. Anything that would
   * reflow the page - collapsing the column's height, for one - waits until
   * it has gone, or the row snaps shut while the map is still sliding out.
   * Under reduced motion there is no slide, so nothing waits.
   */
  const [settledView, setSettledView] = useState<View>("both");
  /**
   * How many cards across. Two beside the map, three when the map has gone,
   * and the switch waits for the slide to finish: re-flowing the grid while
   * the column is still growing changes every card's width on every frame,
   * which is the jitter this exists to stop.
   */
  const threeAcross = view === "list" && settledView === "list";
  /** The map is still on its way out, or here. Its frame keeps its height. */
  const mapPresent = view !== "list" || settledView !== "list";
  const [settled, setSettled] = useState(true);
  const [drawn, setDrawn] = useState(start.drawn);
  const [selected, setSelected] = useState<string | null>(null);
  /** The home whose compact card is over the map, if any. */
  const [raised, setRaised] = useState<string | null>(null);
  /** The home the pointer is over, on either side. Lights the other side. */
  const [hovered, setHovered] = useState<string | null>(null);
  /**
   * Whether she arrived from the conversation.
   *
   * One of the two switches the whole page branches on. In the prototype it is
   * state; in a real build it would be whatever the handoff sets, and it must
   * be declared by that handoff rather than guessed from behaviour.
   */
  const [hasContext, setHasContext] = useState(startContext);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  /** The chat pill's panel: her five sentences, open over the page. */
  const [contextOpen, setContextOpen] = useState(false);
  /** She has edited a clause. Signed out, that is when the search becomes hers to lose. */
  const [contextChanged, setContextChanged] = useState(false);
  /**
   * Whether the agents lead with Tamil. It is on because she typed "a tamil
   * agent would help", and the panel lets her take it back.
   */
  const [tamilFirst, setTamilFirst] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  /** At least this many rooms. What the conversation came to, until she says otherwise. */
  const [rooms, setRooms] = useState<Rooms>(start.rooms);
  /** How far each place reaches. Her fifteen and ten to begin with. */
  const [minutes, setMinutes] = useState<Record<Need, Minutes>>(BASE_MINUTES);
  const [needs, setNeeds] = useState<Record<Need, boolean>>(start.needs);
  /** Where the reviewer looks from. A phone is this page again, in a frame. */
  const [device, setDevice] = useState<Device>("desktop");
  const cards = useRef(new Map<string, HTMLElement | null>());
  const searchTop = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => setSettledView(view), still ? 0 : 300);
    return () => window.clearTimeout(id);
  }, [view]);

  // "Not now" dismisses for the session and does not return on this visit,
  // which is the usual way a nudge becomes a nag.
  useEffect(() => {
    let gone = false;
    try {
      gone = window.sessionStorage.getItem("nudge-dismissed") === "1";
    } catch {
      /* storage refused: the bar simply shows */
    }
    if (!gone) return;
    const id = window.setTimeout(() => setNudgeDismissed(true), 0);
    return () => window.clearTimeout(id);
  }, []);
  const dismissNudge = () => {
    setNudgeDismissed(true);
    try {
      window.sessionStorage.setItem("nudge-dismissed", "1");
    } catch {
      /* nothing to do */
    }
  };

  // A shared link can open straight into the expanded view. It is a state,
  // not a route, so the parameter is read once and never pushed.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("view") !== "expanded")
      return;
    const id = window.setTimeout(() => setExpanded(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  // Her choice is remembered across sessions, per the design. Read once on
  // mount rather than at render, so the server and the first paint agree.
  useEffect(() => {
    let kept: string | null = null;
    try {
      kept = window.localStorage.getItem("search-view");
    } catch {
      /* private mode, or storage refused: the default is fine */
    }
    if (kept !== "list" && kept !== "both" && kept !== "map") return;
    const id = window.setTimeout(() => setView(kept as View), 0);
    return () => window.clearTimeout(id);
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem("search-view", view);
    } catch {
      /* nothing to do */
    }
  }, [view]);

  const state = useMemo(
    () => ({
      shapes: value.shapes,
      inBendale: value.where === SEARCH.where,
      underBudget: value.budget !== null,
      ceiling: asCeiling(value.budget),
      floor: value.floor ?? undefined,
      nearHospital: needs.nearHospital,
      nearTransit: needs.nearTransit,
      nearTemple: needs.nearTemple,
      nearGrocery: needs.nearGrocery,
      minutes,
      minBeds: rooms.beds,
      minBaths: rooms.baths,
    }),
    [value, needs, minutes, rooms],
  );
  /** The lines the cards are read against follow the places she has drawn. */
  const thresholds: Thresholds = {
    hospitalMinutes: minutes.nearHospital,
    transitMinutes: minutes.nearTransit,
  };

  /**
   * The pause the bar renders as "Counting" rather than as a stale number.
   *
   * The figure is computed synchronously, so this is honesty about a real
   * lookup rather than a fake delay: it is the shape the component has to have
   * once the count comes from anywhere slower than a table in memory.
   */
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setSettled(false);
    const done = setTimeout(() => setSettled(true), 280);
    return () => clearTimeout(done);
  }, [state]);

  const count = countFor(state);
  const shownTotal = totalFor(state, settled);

  /**
   * A clause in the panel became a change to the search.
   *
   * The patch is written in the count table's terms, so the number she saw
   * beside the option is the number she gets. Translated here into the two
   * pieces of state the page actually keeps.
   */
  const applyPatch = (patch: SearchPatch) => {
    setValue((current) => ({
      ...current,
      shapes: patch.shapes ?? current.shapes,
      where:
        patch.inBendale === undefined
          ? current.where
          : patch.inBendale
            ? SEARCH.where
            : "All of Scarborough",
      budget:
        patch.underBudget === undefined
          ? current.budget
          : patch.underBudget
            ? SEARCH.budget
            : null,
    }));
    setNeeds((current) => ({
      ...current,
      ...(patch.nearHospital === undefined ? {} : { nearHospital: patch.nearHospital }),
      ...(patch.nearTransit === undefined ? {} : { nearTransit: patch.nearTransit }),
    }));
    if (patch.tamilFirst !== undefined) setTamilFirst(patch.tamilFirst);
    setContextChanged(true);
  };

  const toggleShape = (shape: Shape) =>
    setValue((current) => ({
      ...current,
      shapes: current.shapes.includes(shape)
        ? current.shapes.filter((s) => s !== shape)
        : [...current.shapes, shape],
    }));
  const shown = useMemo(() => listingsFor(state, LISTINGS), [state]);
  const savedHere = shown.filter((l) => account.isSaved(l.id)).length;

  /** What a choice in the search bar would give, from the same table. */
  const countWith = (probe: SearchProbe) =>
    countFor({
      ...state,
      // A budget probe prices a ceiling against the market, not against
      // the minimum she happens to have set.
      floor: probe.budget === undefined ? state.floor : undefined,
      inBendale: (probe.where ?? value.where) === SEARCH.where,
      underBudget: (probe.budget === undefined ? value.budget : probe.budget) !== null,
      ceiling: asCeiling(probe.budget === undefined ? value.budget : probe.budget),
    });

  /**
   * The search bar, shrunk to a pill once it has scrolled away.
   *
   * She should never lose sight of what she is searching for, or have to
   * scroll back up to change it. Once the hero's bar leaves the window the
   * sticky header carries it as one line, and pressing that drops the full
   * bar back over the page where she is.
   */
  /** How far in she has zoomed the map. 1 is the drawing's own scale. */
  const [zoom, setZoom] = useState(1);
  const [collapsed, setCollapsed] = useState(false);
  const [barOpen, setBarOpen] = useState(false);
  useEffect(() => {
    const target = searchTop.current;
    if (!target) return;
    const watcher = new IntersectionObserver(
      ([entry]) => setCollapsed(entry ? entry.boundingClientRect.bottom < 0 : false),
      { threshold: 0 },
    );
    watcher.observe(target);
    return () => watcher.disconnect();
  }, []);
  useEffect(() => {
    if (!barOpen) return;
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") setBarOpen(false);
    }
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [barOpen]);

  /** Homes on the suite route under everything else she set. The pill's own number. */
  /**
   * The place, not the option. "All of Scarborough" is how the search bar
   * names its widest choice; "a legal suite in All of Scarborough" is not a
   * sentence anyone would write.
   */
  const place = value.where.replace(/^All of /, "");

  const pick = (id: string) => {
    setSelected((current) => (current === id ? null : id));
    setRaised(null);
    if (selected === id) return;
    cards.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  /**
   * A pin press never leaves the map.
   *
   * It fills the pin, lights the card in the column, and raises the compact
   * card over the map where she is looking. It does not scroll the list to
   * the card, because she did not ask to read the list; she pressed a pin.
   * Pressing the same pin again, or the X, puts the card away and leaves the
   * pair lit.
   */
  const raise = (id: string) => {
    setSelected(id);
    setRaised((current) => (current === id ? null : id));
  };

  const stickyBar = (
    <StickyBar
    view={expanded ? "map" : view}
    state={state}
    summary={hasContext ? SUMMARY : null}
    total={shownTotal}
    onToggleShape={toggleShape}
    onView={(next) => {
      setView(next);
      // Below 64rem the map and the list stack, so switching from deep in
      // the list leaves her looking at whatever sat under it, with the map
      // a screen or two above. Bring the results up with the change.
      if (next !== view && window.matchMedia("(max-width: 63.99rem)").matches) {
        document
          .getElementById("results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }}
    filterCount={
      Object.values(needs).filter(Boolean).length +
      (rooms.beds > 1 ? 1 : 0) +
      (rooms.baths > 1 ? 1 : 0)
    }
    minutes={minutes}
    onMinutes={(need, next) =>
      setMinutes((current) => ({ ...current, [need]: next }))
    }
    needs={needs}
    onToggleNeed={(need) =>
      setNeeds((current) => ({ ...current, [need]: !current[need] }))
    }
    onOpenFilters={() => setFiltersOpen(true)}
    searchOpen={contextOpen}
    onOpenSearch={() =>
      hasContext
        ? setContextOpen((o) => !o)
        : searchTop.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  />
  );

  /**
   * Save and share act on the search as an object, so they sit beside the
   * count, where the search is named, and in the expanded view's chrome.
   */
  const searchActions = (
    <SearchActions
      saved={account.searchKept}
      onToggleSave={() =>
        account.signedIn
          ? account.toggleSearchKept()
          : account.askToKeepSearch()
      }
      shareHref={expanded ? "?view=expanded" : undefined}
    />
  );

  const mapPanel = (
  <PriceMap
    viewBox={`${SEARCH_MAP_CANVAS.x} ${SEARCH_MAP_CANVAS.y} ${SEARCH_MAP_CANVAS.width} ${SEARCH_MAP_CANVAS.height}`}
    image="/homes/map-bendale-tall.jpg"
    className="overflow-hidden"
    title={`Where the ${count} homes are`}
    boundary={drawn ? SEARCH_BOUNDARY : undefined}
    labels={[...SEARCH_LABELS]}
    places={SEARCH_PLACES.filter((p) => places.includes(p.kind))}
    pins={pinsFor(LISTINGS, shown)}
    labelBy="price"
    cover
    constantPins
    minUnit={0.5}
    selectedId={selected}
    hoveredId={hovered}
    onSelect={raise}
    onHover={setHovered}
  />
  );

  /*
    The map's own controls belong to the frame, not to the drawing.

    In Both the drawing is wider than the frame and slides under it, so a
    control drawn on the drawing slides out of sight with it. These are pinned
    to the frame instead, which is also what makes them stay put when the crop
    moves.
  */
  const raisedListing = raised
    ? (shown.find((l) => l.id === raised) ?? null)
    : null;

  const mapControls = (
  <>
    {raisedListing ? (
      <MapPopover
        key={raisedListing.id}
        listing={raisedListing}
        onClose={() => setRaised(null)}
      />
    ) : null}
    <div className="absolute inset-x-3 top-3 flex flex-wrap items-center gap-2 sm:inset-x-4 sm:top-4">

      <PlacesDrawer
        options={PLACES}
        active={places}
        onToggle={(kind) =>
          setPlaces((current) =>
            current.includes(kind)
              ? current.filter((k) => k !== kind)
              : [...current, kind],
          )
        }
      />
    </div>

    {/*
      One control on the map, not a fourth item in the toggle, and in the
      corner a map keeps that kind of thing: how much map she is looking at.
      It does not render below 64rem, where map view already is this.
    */}
    {/*
      How much map she is looking at, in one stack in the corner a map keeps
      that kind of thing: expand above, zoom below. Neither renders below
      64rem, where map view already is the whole screen.
    */}
    <div className="absolute top-3 right-3 hidden flex-col items-end gap-1.5 sm:top-5 sm:right-5 lg:flex">
      {expanded ? null : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex size-[34px] items-center justify-center rounded-lg bg-background text-ink shadow-[0_2px_6px_rgba(22,24,26,0.14)] transition-colors hover:bg-sunken"
        >
          <ExpandIcon />
          <span className="sr-only">Expand the map</span>
        </button>
      )}
      <MapZoom zoom={zoom} min={1} max={1 + ZOOM_STEP * 2} onZoom={setZoom} />
    </div>

    {/*
      The dots inside the pins, read against words. The shapes used to sit
      on the bar as chips with the same dots; now they are in Filters, so
      the legend is on the map, where the dots are.
    */}
    <div
      aria-label="What the colour of each pin means"
      className="absolute right-3 bottom-3 hidden items-center gap-3.5 rounded-full border border-[#DFE2E4] bg-background px-3.5 py-2 sm:right-4 sm:bottom-4 md:flex"
    >
      {state.shapes.map((shape) => (
        <span key={shape} className="flex items-center gap-1.5 text-[12px]/4 text-ink-body">
          <ShapeGlyph shape={shape} size={15} />
          {SHAPE_LABEL[shape]}
        </span>
      ))}
    </div>

    {drawn ? (
      <div className="absolute bottom-3 left-3 flex items-center gap-2.5 rounded-full border border-[#DFE2E4] bg-background px-4 py-2 sm:bottom-4 sm:left-4">
        <span className="size-[11px] shrink-0 rounded-[3px] bg-action opacity-35" />
        <span className="text-[13px]/5 font-medium text-ink">
          {value.where}
        </span>
        <span className="text-[13px]/5 text-ink-muted">
          {insideBoundary(shown.map((l) => l.id))} of the {shown.length} on the map are inside it
        </span>
      </div>
    ) : null}
  </>
  );

  return (
    <ExitHintProvider>
      <main className="min-h-dvh bg-background pb-[var(--tour-inset,0px)]">
        {/*
          Null until she signs in. The nav is the one control that changes
          when she does, and the design's own note caught the build opening
          signed in with a home already saved "while every argument on this
          page is about a logged-out visitor".
        */}
        <SiteNav
          active="Buying"
          savedCount={account.signedIn ? account.saved.length : null}
          onSignIn={account.askToSignIn}
        />

        {hasContext && !account.signedIn && !nudgeDismissed ? (
          <NudgeBar
            kept={[
              { label: "Where", value: place },
              { label: "Ceiling", value: budgetLabel(value.budget, value.floor) },
              {
                label: "Rooms",
                value: `${rooms.beds}+ bedrooms, ${rooms.baths}+ bathrooms`,
              },
              {
                label: "How everyone fits",
                value: state.shapes
                  .map((shape) => SHAPES.find((s) => s.shape === shape)!.short)
                  .join(", "),
              },
              {
                label: "Within reach",
                value:
                  NEEDS.filter((need) => needs[need])
                    .map((need) => needLabel(need, minutes))
                    .join(", ") || "Nothing required",
              },
              {
                label: "Agents",
                value: tamilFirst ? "Tamil speakers first" : "Any language",
              },
            ]}
            onKeep={() => {
              dismissNudge();
              account.askToKeepSearch();
            }}
            onDismiss={dismissNudge}
            onEdit={() => {
              setContextOpen(true);
              document
                .getElementById("results")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        ) : null}

        {/*
          The hero and the search bar are one white band, centred, with the
          number at the head of the sentence. Every field below it arrived
          filled, and the sentence is what proves nothing started over.
        */}
        <section className="bg-background px-4 pt-11 pb-[34px] sm:px-6">
          <div
            ref={searchTop}
            className="mx-auto flex w-full max-w-[1328px] flex-col items-center gap-10"
          >
            <div className="flex flex-col items-center gap-3.5 text-center">
              <h1 className="text-[28px]/[34px] font-bold tracking-[-0.035em] text-ink sm:text-[46px]/[54px]">
                {hasContext
                  ? "A house your parents can move into"
                  : `Homes with a legal suite in ${place}`}
              </h1>
              {savedHere > 0 ? (
                <Exit>
                  <Link
                    href="/the-ones-we-saved"
                    className="flex items-center gap-2 rounded-full bg-background px-4 py-2 text-[13px]/[19px] font-medium text-ink shadow-[0_1px_3px_rgba(22,24,26,0.12)]"
                  >
                    <span className="flex size-6 items-center justify-center rounded-full bg-action text-[12px] font-semibold text-white">
                      {savedHere}
                    </span>
                    of these {count} are already saved
                    <span aria-hidden>&rsaquo;</span>
                  </Link>
                </Exit>
              ) : null}
            </div>

            <div className="flex w-full max-w-[1180px] flex-col gap-3">
              <SearchBar
                value={value}
                onChange={setValue}
                count={count}
                total={BENDALE_HOMES}
                countWith={countWith}
                onSearch={() =>
                  document
                    .getElementById("results")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              />
            </div>
          </div>
        </section>

        {/*
          The bar and, when she asks for it, her sentences underneath it. The
          panel drops over the page from the bar's own edge, so it follows the
          bar when the bar sticks and the page underneath does not move.
        */}
        {/*
          One sticky header: the compact search once the hero's bar has gone,
          the bar itself, and whatever either of them drops over the page.
          Sticky on the wrapper, not on the rows, because a sticky child can
          only travel inside its parent's box.
        */}
        <div className="sticky top-0 z-30">
          {collapsed ? (
            <div className="border-b border-hairline bg-background/95 px-4 py-2 backdrop-blur-[2px] sm:px-6">
              <div className="mx-auto flex w-full max-w-[1328px] justify-center">
                <CompactSearch
                  looking={value.looking}
                  where={value.where}
                  budget={budgetLabel(value.budget, value.floor)}
                  onOpen={() => setBarOpen(true)}
                />
              </div>
            </div>
          ) : null}
          {barOpen ? (
            <>
              <button
                type="button"
                aria-label="Close the search"
                onClick={() => setBarOpen(false)}
                className="fixed inset-0 z-30 cursor-default bg-ink/25"
              />
              <div className="absolute inset-x-0 top-0 z-40 border-b border-hairline bg-background px-4 pt-4 pb-5 shadow-[0_18px_40px_-12px_rgba(22,24,26,0.28)] sm:px-6">
                <div className="mx-auto w-full max-w-[1180px]">
                  <SearchBar
                    value={value}
                    onChange={setValue}
                    count={count}
                    total={BENDALE_HOMES}
                    countWith={countWith}
                    autoFocus
                    onSearch={() => {
                      setBarOpen(false);
                      document
                        .getElementById("results")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  />
                </div>
              </div>
            </>
          ) : null}
          {stickyBar}
          {contextOpen && hasContext ? (
            <ContextPanel
              state={state}
              tamilFirst={tamilFirst}
              onApply={applyPatch}
              onClose={() => setContextOpen(false)}
              changed={contextChanged}
              signedIn={account.signedIn}
              onKeep={() => {
                setContextOpen(false);
                account.askToKeepSearch();
              }}
            />
          ) : null}
        </div>

        {/* The scroll margin is the sticky header: two lines of bar under the pill on a phone, one on a desktop. */}
        <section id="results" className="scroll-mt-[11.5rem] px-4 pt-8 pb-12 sm:px-6 lg:scroll-mt-32">
          {/*
            The heading sits above both columns, so the map and the first row
            of cards share a top edge. The number is spelled because it opens
            the sentence, and withheld while a recount settles.
          */}
          <div className="mx-auto mb-4 flex w-full max-w-[1328px] flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="flex flex-col gap-[3px]">
              <h2 className="text-[20px]/[28px] font-semibold tracking-[-0.02em] text-ink sm:text-[26px]/[34px]">
                {settled ? `${spelledOut(count)} homes match` : "Counting"}
              </h2>
              <p className="text-[13px]/5 text-ink-prose">
                No account until you save one. Nothing here is yours until you
                press it.
              </p>
            </div>
            {searchActions}
          </div>

          <div
            className={cn(
              "mx-auto w-full max-w-[1328px]",
              // Not flex-wrap. The list column's natural width is two cards
              // wide, so a wrapping row measured it against the map and put the
              // map underneath - which is the layout we explicitly rejected.
              // One row, and the list shrinks into what is left.
              "flex flex-col items-start lg:flex-row",
              // The gap belongs between two columns. In List and Map one of
              // them is collapsed to nothing, and the gap was still holding
              // 24px open beside it.
              view === "both" ? "gap-6" : "gap-0",
            )}
          >
            <div
              className={cn(
                // Width and opacity animate; height does not. The frame keeps
                // its 540 while the map slides out and only collapses once it
                // has gone, so the row does not snap shut mid-slide. In Map
                // view the same frame is simply wider: the map uncrops rather
                // than scales, exactly as the design describes it.
                "relative flex items-center justify-center overflow-hidden transition-[width,opacity] duration-300 ease-out motion-reduce:transition-none",
                // Beside the list the map is as tall as the window allows and
                // stays put while the page scrolls under it, the way the map
                // does on every listings site she has used.
                // 7.5rem is the sticky header when it has collapsed to the
                // pill and the bar, which it has by the time the map sticks.
                mapPresent && "h-[24rem] rounded-2xl lg:h-[calc(100vh-8.5rem)]",
                view !== "list" && "border border-hairline",
                !mapPresent && "max-h-0",
                view === "list" && "w-0 opacity-0",
                view === "both" &&
                  "order-1 w-full shrink-0 opacity-100 lg:order-2 lg:sticky lg:top-[7.5rem] lg:w-[clamp(34rem,50%,52rem)]",
                view === "map" && "w-full opacity-100",
              )}
            >
              {/*
                The drawing covers the frame at whatever scale that takes,
                and the pins hold their size while it does. Beside the list
                the whole area is in view; in Map view the frame is wider
                and shows it at the drawing's own scale.
              */}
              <div
                style={{ transform: `scale(${zoom})` }}
                className={cn(
                  "origin-center transition-transform duration-200 motion-reduce:transition-none",
                  mapPresent && "h-full w-full",
                )}
              >
                {mapPanel}
              </div>
              {view === "list" ? null : mapControls}
            </div>


            <div
              className={cn(
                "flex flex-col gap-5 overflow-hidden transition-opacity ease-out motion-reduce:transition-none",
                // Going to Map the list gives up its width at once and the
                // map slides over it; keeping `grow` here left the list
                // holding 24rem open until the slide had ended, and the map
                // jumped the rest of the way.
                view === "both" && "order-2 min-w-0 grow lg:order-1 lg:min-w-[24rem]",
                view === "list" && "w-full",
                view === "map" && "max-h-0 w-0 opacity-0 duration-300",
                // Between Both and List the column changes width under a
                // grid that has not changed yet, and every photograph
                // stretched with it. So the list fades out quickly while
                // the map slides, and fades back in at its settled layout.
                view !== "map" &&
                  (view !== settledView
                    ? "opacity-0 duration-150"
                    : "opacity-100 duration-300"),
              )}
            >

            {shown.length === 0 ? (
              <p className="rounded-xl border border-dashed border-hairline-strong px-5 py-10 text-center text-sm/6 text-ink-muted">
                Nothing matches that. Open Shape above and turn one back on.
              </p>
            ) : (
              <div
                className={cn(
                  // Two across beside the map, three when the map has gone.
                  "grid grid-cols-1 gap-5 sm:grid-cols-2",
                  threeAcross && "lg:grid-cols-3",
                )}
              >
                {shown.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    density="page"
                    /*
                      The checklist is every row measured against a number she
                      set, and on the cold arrival nobody set one. It does not
                      render there rather than rendering against a default,
                      because a threshold nobody chose is not hers: the card
                      gets the sentence and the price. Beside the map the row
                      is short and shows two lines; standing alone it shows
                      all three.
                    */
                    matters={
                      hasContext ? mattersFor(listing, thresholds) : []
                    }
                    action={<SaveButton listingId={listing.id} bare />}
                    selected={
                      selected === listing.id || hovered === listing.id
                    }
                    onSelect={() => pick(listing.id)}
                    onHover={(over) => setHovered(over ? listing.id : null)}
                    ref={(node) => {
                      cards.current.set(listing.id, node);
                    }}
                  />
                ))}
              </div>
            )}
            </div>
          </div>

        </section>

        {expanded ? (
          <ExpandedView
            bar={stickyBar}
            map={mapPanel}
            controls={mapControls}
            signedIn={account.signedIn}
            savedCount={account.saved.length}
            onSignIn={() => account.askToKeepSearch()}
            listings={shown}
            selected={selected}
            count={count}
            onSelect={pick}
            actions={searchActions}
            onCollapse={() => setExpanded(false)}
          />
        ) : null}

        {filtersOpen ? (
          <FilterModal
            state={state}
            minutes={minutes}
            onMinutes={(need, next) =>
              setMinutes((current) => ({ ...current, [need]: next }))
            }
            rooms={rooms}
            onRooms={setRooms}
            chatRooms={hasContext ? CHAT_ROOMS : null}
            afford={
              account.signedIn
                ? {
                    address: account.soldAddress ?? SAMPLE_ADDRESS,
                    semi: SEMI_WORKED.value.value,
                    ceiling: SEMI_WORKED.ceiling,
                  }
                : null
            }
            count={shownTotal}
            settled={settled}
            onToggleShape={toggleShape}
            onToggleNeed={(need) =>
              setNeeds((current) => ({ ...current, [need]: !current[need] }))
            }
            onCeiling={(ceiling) => setValue((v) => ({ ...v, budget: ceiling }))}
            onFloor={(floor) => setValue((v) => ({ ...v, floor }))}
            onClearAll={() => {
              setNeeds({
                nearHospital: false,
                nearTransit: false,
                nearTemple: false,
                nearGrocery: false,
              });
              setValue((current) => ({ ...current, budget: null, floor: null }));
              setRooms({ beds: 1, baths: 1 });
            }}
            // The account sheet opens over the modal, and Escape reaches
            // both. While the sheet is up, the modal ignores it so that
            // cancelling the steps leaves her where she started them.
            onClose={() => {
              if (!account.asking) setFiltersOpen(false);
            }}
            onOpenValuation={() => {
              // Straight into the steps, which ask for the address first.
              // The modal stays open underneath: the steps are a detour
              // from the price filter and end back at it, with the range
              // her house supports drawn in.
              account.askForBudget();
            }}
          />
        ) : null}

        {framed ? null : (
          <StateSwitch
            hasContext={hasContext}
            signedIn={account.signedIn}
            device={device}
            onContext={(on) => {
              const next = fromContext(on);
              setHasContext(on);
              setNudgeDismissed(false);
              setContextOpen(false);
              setContextChanged(false);
              setTamilFirst(true);
              setNeeds(next.needs);
              setRooms(next.rooms);
              setPlaces(next.places);
              setDrawn(next.drawn);
              setValue((current) => ({
                ...current,
                looking: next.looking,
                where: next.where,
                budget: next.budget,
                floor: null,
              }));
            }}
            onSignedIn={(next) => account.setSignedIn(next)}
            onDevice={setDevice}
          />
        )}
        {device === "phone" && !framed ? (
          <PhoneFrame
            src={`/homes-with-a-suite?frame=phone&context=${hasContext ? "on" : "off"}&account=${account.signedIn ? "in" : "out"}`}
          />
        ) : null}

        {/*
          The language row on every card exists because she typed "a tamil
          agent would help" (criteria.ts, id "tamil"). It is the declared
          criterion that switches this section, never the route.
        */}
        {/*
          The rest of the FINAL: what she can spend, then the agents. Both read
          the same search the results do, so the count and the area never
          come from copy.
        */}
        <BudgetBlock
          context={hasContext}
          homes={shown}
          ceiling={value.budget}
          onCeiling={(next) =>
            setValue((current) => ({ ...current, budget: asCeiling(next) ?? null }))
          }
        />
        <AgentsSection
          declared={hasContext && tamilFirst ? { language: "Tamil" } : null}
        />

        <SiteFooter note="Sharing your saved homes emails the people you name. Nothing goes to an agent." />
        <ExitHintBanner />
      </main>
    </ExitHintProvider>
  );
}

function ExpandIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M6 1.5H1.5V6M10 1.5H14.5V6M14.5 10V14.5H10M6 14.5H1.5V10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


