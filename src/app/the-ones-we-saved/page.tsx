"use client";

import Link from "next/link";
import { AccountProvider } from "@/components/account/account-provider";
import { Exit, ExitHintBanner, ExitHintProvider } from "@/components/exit-hint";
import { BudgetLine } from "@/components/saved/budget-line";
import { CollectionHeader } from "@/components/saved/collection-header";
import { ListHeader } from "@/components/saved/list-header";
import { NewMatches } from "@/components/saved/new-matches";
import { NextLine } from "@/components/saved/next-line";
import { SavedGrid } from "@/components/saved/saved-grid";
import { SavedPanel } from "@/components/saved/saved-panel";
import { SavedProvider, useSaved } from "@/components/saved/saved-provider";
import { SavedRail } from "@/components/saved/saved-rail";
import { SetThread } from "@/components/saved/set-thread";
import { StagePills } from "@/components/saved/stage-pills";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { AGENT, SAVED_SEARCHES, savedHomeIds } from "@/data/saved";
import { libraryHomeIds, listById } from "@/lib/domain/saved-view";

/**
 * Saved. The page that has to earn a second visit.
 *
 * Everything else this product does can be done somewhere else. A spreadsheet
 * holds addresses. A group chat holds what her mother thought. An alert email
 * holds a price cut. What lives here and nowhere else:
 *
 *   The record. 7 Galloway sold for $1,352,000, and that line exists only
 *   because she saved it before it went.
 *
 *   The people, in two lanes. Her mother leaves voice notes in Tamil and her
 *   sister argues back and her husband asks whether they are still inside;
 *   that is one lane and the agent cannot see it. The agent answers a permit
 *   question with a date and puts the signed offer on file; that is the
 *   other, and the family can. A sentence crosses from the first to the
 *   second when whoever wrote it sends it, and never when it names the line.
 *
 *   The collections. "Ones Appa can manage" holds homes from two different
 *   searches, because step-free access was never a facet she searched on.
 *   No search returns that set. She had been keeping it in her head.
 *
 *   Where each one is up to. A tag she sets - to view, visited, offer in,
 *   closing, gone - and the pills over the grid filter by it. Nothing
 *   infers it.
 *
 * The model is the phone's photo library: everything she saved is in the
 * library, always; a collection is a view over it; a search is the one thing
 * here that keeps working while she is away. Opening a home is a panel over the
 * page, never a navigation, so closing it leaves her exactly where she was.
 *
 * This file only composes. Every decision about what she is told lives in
 * `src/lib/domain/`, and every piece of state in `SavedProvider`.
 */
export default function SavedPage() {
  return (
    <AccountProvider
      startSignedIn
      startName="Nirosha"
      startSaved={savedHomeIds()}
    >
      <SavedProvider>
        <ExitHintProvider>
          <Saved />
        </ExitHintProvider>
      </SavedProvider>
    </AccountProvider>
  );
}

function Saved() {
  const { state, world } = useSaved();
  const list = listById(
    state.section,
    state.openList[state.section],
    world,
    state,
  );
  const total = libraryHomeIds(world, state).length;
  const collection =
    state.section === "collections"
      ? state.collections.find((c) => c.id === list?.id)
      : undefined;
  const search =
    state.section === "searches"
      ? SAVED_SEARCHES.find((s) => s.id === list?.id)
      : undefined;

  return (
    <main className="min-h-dvh bg-background pb-[var(--tour-inset,0px)]">
      <SiteNav active="Listings" savedCount={total} />

      <div className="mx-auto flex w-full max-w-[1328px] flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8 lg:py-7">
        <aside className="shrink-0 lg:w-[280px]">
          <SavedRail />
        </aside>

        <div className="flex min-w-0 grow flex-col gap-5">
          {list ? (
            <>
              {collection ? (
                <CollectionHeader list={list} collection={collection} />
              ) : (
                <ListHeader list={list} />
              )}

              {/*
                Two lines about the whole list, in the order she needs them:
                how many she can still buy, and the next thing with a date.
                Both used to be grey panels. Neither is one now.
              */}
              <div className="flex flex-col gap-2">
                <BudgetLine list={list} />
                <NextLine list={list} />
              </div>

              {search ? <NewMatches search={search} /> : null}
              <StagePills list={list} />
              <SavedGrid list={list} />
              {collection ? <SetThread collection={collection} /> : null}
            </>
          ) : null}

          <Exit>
            <Link
              href="/homes-with-a-suite"
              className="flex w-fit items-center gap-2 rounded-full border border-hairline-strong px-5 py-2.5 text-[13px]/[19px] font-semibold text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
            >
              Back to the search
              <span aria-hidden>&rsaquo;</span>
            </Link>
          </Exit>
        </div>
      </div>

      <SavedPanel />
      <SiteFooter note={`Sharing emails the people you name. ${AGENT.name} sees the homes you put her on, the papers, and what you send her. Not your budget, not your home, not what the family says.`} />
      <ExitHintBanner />
    </main>
  );
}
