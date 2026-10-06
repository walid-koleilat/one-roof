"use client";

import { useId, useState } from "react";
import { XIcon } from "lucide-react";
import { ProvenanceTag } from "@/components/provenance-tag";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Listing } from "@/data/listings";
import { STAGES, type SavedHome, type Stage } from "@/data/saved";
import { agentOnFor } from "@/lib/domain/agent-view";
import { formatCurrency } from "@/lib/domain/format";
import { isVerified, suiteLabel } from "@/lib/domain/listing";
import { collectionsFor, stageFor, stageLabel, statusLine } from "@/lib/domain/saved-view";
import { nextItem, nextLine } from "@/lib/domain/saved-week";
import { cn } from "@/lib/utils";
import { AgentLane } from "./agent-lane";
import { AgentSeat } from "./agent-seat";
import { CollectionMenu } from "./collection-menu";
import { FamilyLane } from "./family-lane";
import { SavedNotes } from "./saved-notes";
import { useSaved } from "./saved-provider";
import { SavedRecord } from "./saved-record";
import { StageChip } from "./saved-tile";

/**
 * One home, opened over the grid, in the order she reads it.
 *
 * The photograph, what the house is, where the purchase stands, the next
 * thing with a date on it, who is on it, then the two conversations, then
 * what happened and what is left to check. That order is an argument: the
 * house first, the deadline second, and the people third, because by the
 * time a family is arguing about a kitchen the question "is this still
 * happening on the thirtieth" has usually stopped being asked out loud.
 *
 * The two lanes are the point of the page. What the family says sits in one
 * lane and what the agent reads sits in another, and a sentence crosses only
 * when whoever wrote it sends it. Before the lanes there was one thread with
 * everybody in it, and Arun's "$1,190,000 as the line" was in it, on a house
 * the agent was working. The panel does not enforce that rule - `agentViewOf`
 * does - but it is where a reader sees it enforced.
 *
 * Nothing in the panel is stored in the panel: the stage she sets, the line
 * she ticks, the reply she writes and the message she sends all go to the
 * reducer, which is why closing it loses nothing.
 *
 * It is a right-hand sheet from `sm` up and a bottom sheet below, the same
 * content in the same order either way.
 */

/** The four she can set. `gone` is the market's, and the group does not offer it. */
const SETTABLE: readonly Stage[] = STAGES.filter((s) => s !== "gone");

/** The fifth item. Radix hands back "" when she clears a single-select; both mean null. */
const NONE = "none";

function asStage(value: string): Stage | null {
  return SETTABLE.find((s) => s === value) ?? null;
}

/**
 * A home she kept off a new match this session, with no fixture record. The
 * same shape `tilesFor` synthesises, re-derived here so the panel and the
 * tile cannot show two different histories for one house.
 */
function justSavedHome(id: string): SavedHome {
  return {
    listingId: id,
    savedOn: "Today",
    history: [],
    notes: [],
    thread: [],
    withAgent: [],
    papers: [],
  };
}

const SHEET = cn(
  // A panel, not a popover: nothing between the photograph and the edge, and the rest scrolls.
  "gap-0 overflow-y-auto p-0 text-ink",
  // 250ms entrance, ease-out. The vendored fade and slide are kept; only their timing changes.
  "duration-250 ease-out",
  // From sm up, a right-hand sheet 520 wide.
  "data-[side=right]:w-full data-[side=right]:sm:max-w-[520px]",
  // Below sm, a bottom sheet: same words, different edge. It comes up from the bottom, not in from the side.
  "max-sm:data-[side=right]:inset-x-0 max-sm:data-[side=right]:top-auto max-sm:data-[side=right]:bottom-0 max-sm:data-[side=right]:h-[92dvh] max-sm:data-[side=right]:rounded-t-2xl max-sm:data-[side=right]:border-t max-sm:data-[side=right]:border-l-0",
  "motion-safe:max-sm:data-[side=right]:data-open:slide-in-from-right-0 motion-safe:max-sm:data-[side=right]:data-open:slide-in-from-bottom-10 motion-safe:max-sm:data-[side=right]:data-closed:slide-out-to-right-0 motion-safe:max-sm:data-[side=right]:data-closed:slide-out-to-bottom-10",
  // Reduced motion: the slide distance goes to nothing and the fade is all that is left.
  "motion-reduce:data-[side=right]:data-open:slide-in-from-right-0 motion-reduce:data-[side=right]:data-closed:slide-out-to-right-0",
);

export function SavedPanel() {
  const { state, dispatch, world } = useSaved();
  const panelId = state.panel?.kind === "home" ? state.panel.id : null;

  // Hold the last home through the close animation, so the sheet slides
  // out with the house still in it rather than going blank on the way.
  const [shownId, setShownId] = useState(panelId);
  if (panelId !== null && panelId !== shownId) setShownId(panelId);

  const listing = shownId
    ? world.listings.find((l) => l.id === shownId)
    : undefined;
  if (!shownId || !listing) return null;

  const home =
    world.homes.find((h) => h.listingId === shownId) ?? justSavedHome(shownId);

  return (
    <Sheet
      open={panelId !== null}
      onOpenChange={(open) => {
        if (!open) dispatch({ type: "close" });
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        overlayClassName="bg-ink/45"
        className={SHEET}
      >
        <PanelBody listing={listing} home={home} />
      </SheetContent>
    </Sheet>
  );
}

function PanelBody({ listing, home }: { listing: Listing; home: SavedHome }) {
  const { state, dispatch } = useSaved();
  const [menuOpen, setMenuOpen] = useState(false);
  const stageLabelId = useId();

  const id = listing.id;
  const stage = stageFor(home, state);
  const collections = collectionsFor(id, state.collections);
  const verified = isVerified(listing.suite);
  const status = statusLine(home);
  const next = nextItem([home], state);
  const seated = agentOnFor(home, state);

  return (
    <>
      <div
        className={cn(
          "relative flex h-[220px] shrink-0 items-start justify-between bg-cover bg-center p-4",
          home.sold && "grayscale-[0.55]",
        )}
        style={{
          backgroundColor: listing.photoTint,
          backgroundImage: `url(${listing.photos[0]})`,
        }}
      >
        {stage ? <StageChip stage={stage} /> : <span />}
        <SheetClose asChild>
          <button
            type="button"
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-ink shadow-[0_1px_3px_rgba(22,24,26,0.22)] transition-colors duration-150 ease-out hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
          >
            <XIcon aria-hidden className="size-4" />
          </button>
        </SheetClose>
      </div>

      <div className="flex flex-col gap-5 px-5 pt-5 pb-6">
        {/* Who and what: the house, then where the purchase stands. */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-4">
            <SheetTitle className="text-[22px]/[30px] font-semibold tracking-[-0.01em] text-ink">
              {listing.address}
            </SheetTitle>
            {home.sold ? (
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-[22px]/[30px] font-semibold text-authority">
                  Sold {formatCurrency(home.sold.price.value)}
                </span>
                <ProvenanceTag provenance={home.sold.price.provenance} size="sm" />
              </span>
            ) : (
              <span className="shrink-0 text-[22px]/[30px] font-semibold text-ink">
                {formatCurrency(listing.askingPrice.value)}
              </span>
            )}
          </div>

          <SheetDescription className="text-[13px]/[19px]">
            <span
              className={cn(
                "font-medium",
                verified ? "text-action-deep" : "text-conf-low",
              )}
            >
              {suiteLabel(listing.suite)}
            </span>
            {/*
              The permit line is off. On a ground-floor home it read "Bed and
              bath on the ground floor · Ground-floor bed and bath", which is
              the same fact twice; and where there is a permit, the paper
              itself is in the lane below with a date on it.
            */}
            <span className="text-ink-muted">
              {" · "}
              {listing.neighbourhood}
            </span>
          </SheetDescription>

          {status ? (
            <p className="pt-1 text-[15px]/[22px] text-ink">{status}</p>
          ) : null}
        </div>

        {/* The one thing with a date on it. */}
        {next ? (
          <div className="flex flex-col gap-0.5 border-l-2 border-action pl-3">
            <p className="font-mono text-[11px] tracking-[0.1em] text-ink-muted uppercase">
              Next
            </p>
            <p className="text-[14px]/[20px] text-ink">{nextLine(next)}</p>
          </div>
        ) : null}

        {/* Filed where, and the one control that changes it. */}
        <div className="flex flex-wrap items-center gap-1.5">
          {collections.map((collection) => (
            <span
              key={collection.id}
              className="rounded-full bg-sunken px-2.5 py-1 text-[12px]/[18px] text-ink"
            >
              {collection.name}
            </span>
          ))}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            className="rounded-full border border-dashed border-hairline-strong px-2.5 py-1 text-[12px]/[18px] font-medium text-ink-muted transition-colors duration-150 ease-out hover:border-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
          >
            <span className="sr-only">Put this home in a collection. </span>
            {collections.length === 0
              ? "Put it in a collection"
              : "Add to a collection"}
          </button>
        </div>

        {/* Where she has got to. Hers to set; the market sets `gone`. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p
            id={stageLabelId}
            className="font-mono text-[11px] tracking-[0.1em] text-ink-muted uppercase"
          >
            Up to
          </p>
          {home.sold ? (
            <span className="text-[13px]/[19px] text-ink-muted">
              Somebody else got it. There is nothing left to set.
            </span>
          ) : (
            <ToggleGroup
              type="single"
              value={stage ?? NONE}
              onValueChange={(value) =>
                dispatch({ type: "setStage", listingId: id, stage: asStage(value) })
              }
              aria-labelledby={stageLabelId}
              className="flex-wrap"
            >
              {SETTABLE.map((s) => (
                <ToggleGroupItem key={s} value={s} size="sm" className={STAGE_ITEM}>
                  {stageLabel(s)}
                </ToggleGroupItem>
              ))}
              <ToggleGroupItem value={NONE} size="sm" className={STAGE_ITEM}>
                None
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>

        <AgentSeat home={home} />
        <FamilyLane home={home} />
        {seated ? <AgentLane home={home} /> : null}

        <SavedRecord home={home} seated={seated} />
        <SavedNotes home={home} />
      </div>

      <CollectionMenu listingId={id} open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}

/**
 * The stage as a pill she can press. The vendored toggle's grey "on" state
 * is replaced with ink, so the one she set reads as set rather than hovered,
 * and its ring gives way to the house focus outline.
 */
const STAGE_ITEM = cn(
  "h-7 rounded-full border border-hairline bg-background px-2.5 text-[12px]/[18px] font-medium text-ink-body",
  "transition-colors duration-150 ease-out hover:bg-sunken hover:text-ink",
  "data-[state=on]:border-ink data-[state=on]:bg-ink data-[state=on]:text-white",
  "focus-visible:border-hairline focus-visible:ring-0 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action",
);
