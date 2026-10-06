"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/wordmark";
import { cn } from "@/lib/utils";

/**
 * The product's navigation, drawn the way a real portal's would be.
 *
 * The only part of it this prototype actually uses is the saved counter on the
 * right, and it is the part that carries the argument: logged out it says
 * "Sign in", logged in it says how many homes are hers. That change is the
 * whole of J2B in one control.
 *
 * Everything drawn here either works or says it is not built. Sign in and
 * Join open the same sheet the first Save does. Buying goes to the search,
 * because that page is the only buying this prototype has, and from Saved it
 * is the way back. The other sections are not in this prototype, and
 * pressing one says so for a moment rather than doing nothing, because a
 * control that does nothing reads as broken.
 */

const SECTIONS = ["Buying", "Selling", "Listings", "My Home", "Agents"] as const;

/** The sections that exist here, and where each one is. */
const HREF: Partial<Record<(typeof SECTIONS)[number], string>> = {
  Buying: "/homes-with-a-suite",
};

export function SiteNav({
  /** Which section is underlined. */
  active,
  /** Null when she has not signed in yet. */
  savedCount,
  /** Sign in and Join. Without it the two are drawn but say they are not built. */
  onSignIn,
  className,
}: {
  active: (typeof SECTIONS)[number];
  savedCount?: number | null;
  onSignIn?: () => void;
  className?: string;
}) {
  const signedIn = typeof savedCount === "number";
  /** The section she just pressed that is not built, for the moment the note shows. */
  const [notBuilt, setNotBuilt] = useState<string | null>(null);
  useEffect(() => {
    if (notBuilt === null) return;
    const id = window.setTimeout(() => setNotBuilt(null), 1800);
    return () => window.clearTimeout(id);
  }, [notBuilt]);
  return (
    <header
      className={cn(
        "border-b border-hairline bg-background px-4 py-[18px] sm:px-6",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-[1328px] items-center gap-10">
      <Link href="/homes-with-a-suite" aria-label="One Roof home">
        <Wordmark width={140} />
      </Link>

      <nav
        aria-label="Sections"
        className="hidden min-w-0 items-center gap-7 overflow-x-auto md:flex"
      >
        {SECTIONS.map((section) => {
          const href = HREF[section];
          const look = cn(
            // The rule under the active item is a border on all of them,
            // transparent on the rest, so the active word does not sit
            // two pixels higher than its neighbours.
            "border-b-2 pb-[3px] text-[15px]/[22px] whitespace-nowrap transition-colors",
            section === active
              ? "border-ink font-semibold text-ink"
              : "border-transparent text-ink-prose hover:text-ink",
          );
          return (
            <span key={section} className="relative shrink-0">
              {href ? (
                <Link
                  href={href}
                  aria-current={section === active ? "page" : undefined}
                  className={look}
                >
                  {section}
                </Link>
              ) : (
                <button
                  type="button"
                  aria-current={section === active ? "page" : undefined}
                  aria-describedby={
                    notBuilt === section ? "nav-not-built" : undefined
                  }
                  onClick={() => {
                    if (section !== active) setNotBuilt(section);
                  }}
                  className={look}
                >
                  {section}
                </button>
              )}
              {notBuilt === section ? (
                <span
                  id="nav-not-built"
                  role="status"
                  className="absolute top-full left-1/2 z-40 mt-2 -translate-x-1/2 rounded-full bg-ink px-2.5 py-1 text-[11px]/[15px] font-medium whitespace-nowrap text-white shadow-[0_4px_12px_rgba(22,24,26,0.2)]"
                >
                  Not in this prototype
                </span>
              ) : null}
            </span>
          );
        })}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-4">
        {signedIn ? (
          <>
            <span className="flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5 text-[13px]/[19px] font-medium text-ink">
              <Heart />
              {savedCount} saved
            </span>
            <span
              aria-label="Nirosha"
              className="flex size-8 items-center justify-center rounded-full bg-action text-[13px] font-semibold text-white"
            >
              N
            </span>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onSignIn ?? (() => setNotBuilt("Sign in"))}
              className="relative rounded-sm text-[15px]/[22px] font-medium text-ink underline-offset-2 hover:underline"
            >
              Sign in
              {notBuilt === "Sign in" ? <NotBuilt /> : null}
            </button>
            <button
              type="button"
              onClick={onSignIn ?? (() => setNotBuilt("Join"))}
              className="relative rounded-full bg-action px-5 py-[9px] text-[14px]/[20px] font-semibold text-white transition-colors hover:bg-action-deep"
            >
              Join
              {notBuilt === "Join" ? <NotBuilt /> : null}
            </button>
          </>
        )}
      </div>
      </div>
    </header>
  );
}

/** The moment's note under a control that is drawn but not built here. */
function NotBuilt() {
  return (
    <span
      role="status"
      className="absolute top-full left-1/2 z-40 mt-2 -translate-x-1/2 rounded-full bg-ink px-2.5 py-1 text-[11px]/[15px] font-medium whitespace-nowrap text-white shadow-[0_4px_12px_rgba(22,24,26,0.2)]"
    >
      Not in this prototype
    </span>
  );
}

function Heart() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M8 13.6 C8 13.6 1.9 10.1 1.9 6.1 C1.9 4.2 3.4 2.8 5.2 2.8 C6.4 2.8 7.5 3.5 8 4.5 C8.5 3.5 9.6 2.8 10.8 2.8 C12.6 2.8 14.1 4.2 14.1 6.1 C14.1 10.1 8 13.6 8 13.6 Z"
        fill="#16181A"
      />
    </svg>
  );
}
