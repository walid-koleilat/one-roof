"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { TOUR, TOUR_PARAM } from "@/components/tour/tour";

/**
 * The bar along the bottom during the guided route.
 *
 * It carries one instruction, because every screen's argument is something
 * that only happens when you press it. It also carries the way out, in plain
 * words, because a tour you cannot leave is a slideshow.
 *
 * It renders nothing at all unless `?tour=1` is on the URL, so the free route
 * is genuinely free of it.
 */
export function TourRail() {
  return (
    <Suspense fallback={null}>
      <Rail />
    </Suspense>
  );
}

function Rail() {
  const params = useSearchParams();
  const path = usePathname();
  const on = params.get(TOUR_PARAM) === "1";
  const at = TOUR.findIndex((stop) => stop.href === path);
  const showing = on && at >= 0;

  /**
   * Reserve the height rather than float over the page.
   *
   * The chat screen is exactly one viewport tall with the composer pinned to
   * the bottom of it, and a floating bar would sit on top of the one control
   * the reader needs to watch. Pages read this variable and shorten
   * themselves by it, so the rail never covers anything.
   */
  useEffect(() => {
    const root = document.documentElement;
    if (showing) root.style.setProperty("--tour-inset", "92px");
    else root.style.removeProperty("--tour-inset");
    return () => {
      root.style.removeProperty("--tour-inset");
    };
  }, [showing]);

  if (!showing) return null;

  const stop = TOUR[at]!;
  const next = TOUR[at + 1];
  const previous = TOUR[at - 1];
  const withTour = (href: string) => `${href}?${TOUR_PARAM}=1`;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 sm:px-6 sm:pb-5">
      <div className="pointer-events-auto flex w-full max-w-[900px] flex-col gap-2.5 rounded-2xl bg-ink px-4 py-3 text-white shadow-[0_16px_40px_-12px_rgba(22,24,26,0.5)] sm:flex-row sm:items-center sm:gap-4 sm:px-5">
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="font-mono text-[11px] sm:text-[10px] tracking-[0.14em] text-warm uppercase">
            {at + 1} of {TOUR.length}
          </span>
          <span aria-hidden className="hidden h-3.5 w-px bg-white/25 sm:block" />
          <span className="text-[13px]/[19px] font-semibold">{stop.name}</span>
        </div>

        <p className="min-w-0 grow text-[13px]/[19px] text-white/80">
          {stop.look}
        </p>

        <div className="flex shrink-0 items-center gap-2">
          {previous ? (
            <Link
              href={withTour(previous.href)}
              className="rounded-full px-3 py-1.5 text-[13px]/[19px] font-medium text-white/70 hover:text-white"
            >
              Back
            </Link>
          ) : null}
          {next ? (
            <Link
              href={withTour(next.href)}
              className="rounded-full bg-white px-4 py-1.5 text-[13px]/[19px] font-semibold text-ink"
            >
              Next
            </Link>
          ) : (
            <Link
              href="/"
              className="rounded-full bg-white px-4 py-1.5 text-[13px]/[19px] font-semibold text-ink"
            >
              Start again
            </Link>
          )}
          <Link
            href={path}
            className="rounded-full px-2 py-1.5 text-[13px]/[19px] text-white/60 hover:text-white"
          >
            Close
          </Link>
        </div>
      </div>
    </div>
  );
}
