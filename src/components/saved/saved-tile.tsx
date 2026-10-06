"use client";

import type * as React from "react";
import { SaveButton } from "@/components/account/save-button";
import { ListingCard } from "@/components/listing-card";
import { useSaved } from "@/components/saved/saved-provider";
import { StatusChip } from "@/components/status-chip";
import type { Stage } from "@/data/saved";
import { verdictFor, verdictLabel } from "@/lib/domain/budget";
import { formatCurrency } from "@/lib/domain/format";
import {
  effectiveSearchHomeIds,
  latestLead,
  stageLabel,
  type SavedTile as Tile,
} from "@/lib/domain/saved-view";
import { cn } from "@/lib/utils";

/**
 * One home in the grid, cut to what she is deciding between.
 *
 * It carried thirteen things: a photograph, a heart with the word "Saved" on
 * it eleven times over, a stage chip, an address, an estimate chip, a bed and
 * bath line, a suite line, two bulleted facts, a price, a verdict chip, a
 * count of notes, a count of messages, and a pill saying how many collections
 * it was in. Every one was true and only four of them were being read.
 *
 * Seven now. The photograph, the heart with no word, the stage she set, the
 * address, what the suite is, the price, and a verdict chip on the two homes
 * where the answer is not simply yes. Then, under a hairline, the one thing
 * a listing site cannot show her: the last thing that happened to this house.
 * The counts came off because a count is a thing to open, not a thing to
 * read, and everything they counted is one press away in the panel.
 *
 * That last line is never called new. Nothing in this product knows when she
 * last looked, and a line that implied it would be the unread badge the docs
 * rule out, wearing a sentence instead of a dot.
 */

/**
 * The stage as a chip on the photograph. Indigo is for gone and nothing
 * else; closing, which is her buying it, is the deep teal.
 */
const STAGE_BG: Record<Stage, string> = {
  "to-view": "bg-action",
  visited: "bg-ink/70",
  "offer-in": "bg-warm",
  closing: "bg-action-deep",
  gone: "bg-authority",
};

export function StageChip({
  stage,
  className,
}: {
  stage: Stage;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px]/[15px] font-semibold text-white",
        STAGE_BG[stage],
        className,
      )}
    >
      {stageLabel(stage)}
    </span>
  );
}

/**
 * The line under the price, the same height on every tile whether it holds a
 * chip or nothing. This is what keeps a row's prices level.
 */
function ChipSlot({ children }: { children?: React.ReactNode }) {
  return <div className="mt-1 flex h-[22px] items-center">{children}</div>;
}

export function SavedTile({ tile }: { tile: Tile }) {
  const { state, dispatch, ceiling, world } = useSaved();
  const { listing, home, stage, latest } = tile;

  /**
   * The heart is the account's, and on this page every home is already saved,
   * so pressing it means "take this out". The account flips its own pill; the
   * grid is drawn from the session. Without this the pill would read Save
   * while the tile stayed put - so the same press removes the home from every
   * search that holds it, in the capture phase, before SaveButton stops the
   * event reaching the card.
   */
  const unsaveEverywhere = () => {
    for (const search of world.searches) {
      if (effectiveSearchHomeIds(search, state).includes(listing.id)) {
        dispatch({ type: "remove", searchId: search.id, listingId: listing.id });
      }
    }
  };

  const sold = home.sold;
  // Somebody else's now. The budget line leaves it out for the same reason.
  const buyable = stage !== "gone" && sold === undefined;
  const verdict = buyable ? verdictFor(listing.askingPrice, ceiling) : "unset";
  const open = state.panel?.kind === "home" && state.panel.id === listing.id;

  return (
    <ListingCard
      listing={listing}
      density="grid"
      hideTravel
      hideMetrics
      lines={[]}
      faded={sold !== undefined}
      selected={open}
      tag={stage ? <StageChip stage={stage} /> : undefined}
      action={
        <span onClickCapture={unsaveEverywhere} className="contents">
          <SaveButton listingId={listing.id} look="mark" />
        </span>
      }
      priceSlot={
        /*
          The price on its own line and the chip on a slot beneath it that is
          the same height whether or not anything is in it. Side by side they
          fitted on some tiles and wrapped on others - "$1,360,000 Over" does
          not go in 173px - and a tile whose price block grew by a line
          pushed its price out of the row's lane. A uniform grid exists so
          prices line up.
        */
        <div className="flex flex-col">
          {sold ? (
            <>
              <span className="text-[18px]/[26px] font-semibold text-authority">
                Sold {formatCurrency(sold.price.value)}
              </span>
              <ChipSlot>
                {/*
                  The one figure on this page a reader would quote back, so
                  it is the one that carries its own label. Every asking
                  price goes bare under the footer's blanket line.
                */}
                <StatusChip tone="warm" size="sm" className="relative z-10">
                  Illustrative
                </StatusChip>
              </ChipSlot>
            </>
          ) : (
            <>
              <span className="text-[18px]/[26px] font-semibold text-ink">
                {formatCurrency(listing.askingPrice.value)}
              </span>
              <ChipSlot>
                {verdict === "depends" ? (
                  <StatusChip tone="warm" size="sm">
                    {verdictLabel(verdict)}
                  </StatusChip>
                ) : verdict === "over" ? (
                  <StatusChip tone="neutral" size="sm">
                    {verdictLabel(verdict)}
                  </StatusChip>
                ) : null}
              </ChipSlot>
            </>
          )}
        </div>
      }
      onSelect={() =>
        dispatch({ type: "open", panel: { kind: "home", id: listing.id } })
      }
    >
      {/*
        Two cells, not one line. The day is the half that answers "is this
        still moving", so it holds its width and the words give way.
      */}
      <p className="mt-2 flex items-baseline gap-1.5 border-t border-hairline pt-2 text-[12px]/[16px] text-ink-muted">
        <span className="min-w-0 grow truncate">{latestLead(latest)}</span>
        {latest ? <span className="shrink-0">{latest.when}</span> : null}
      </p>
    </ListingCard>
  );
}
