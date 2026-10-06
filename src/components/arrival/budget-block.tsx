"use client";

import { useState } from "react";
import { useAccount } from "@/components/account/account-provider";
import { SAMPLE_ADDRESS, SEMI_BRACKET, SEMI_WORKED } from "@/data/semi-bracket";
import type { Listing } from "@/data/listings";
import { formatCurrency, spelled } from "@/lib/domain/format";
import { cn } from "@/lib/utils";

export interface BudgetBlockProps {
  /**
   * True when she arrived from the chat, where she said she has a semi to
   * sell. The bracket card follows from that one sentence and from nothing
   * else: without it, "A semi like yours" is a home type we assumed, and the
   * brief forbids inferring what she never declared. The left column stays,
   * because an address in and a number out assumes nothing.
   */
  context?: boolean;
  /**
   * The homes on the page right now. The opening line counts them and
   * brackets their asking prices, so it cannot disagree with the cards above
   * it the way a typed-in "eight" already did once.
   */
  homes?: readonly Listing[];
  /** The search's ceiling, so the worked number can say whether it is already in use. */
  ceiling?: number | null;
  /** Take the worked ceiling into the search. */
  onCeiling?: (ceiling: number) => void;
}

const NO_HOMES: readonly Listing[] = [];

/**
 * What the first paragraph says about the homes on the page.
 *
 * Pure, so the sentence can be tested without a DOM. It belongs in
 * `src/lib/domain/`; it lives here only because this change was scoped to the
 * component and its data.
 */
export function homesLine(homes: readonly Listing[]): string {
  const depends = "depends on what your own house sells for.";
  if (homes.length === 0) return `What you can afford ${depends}`;

  const prices = homes.map((h) => h.askingPrice.value);
  const low = Math.min(...prices);
  const high = Math.max(...prices);

  if (homes.length === 1) {
    return `That home is asking ${formatCurrency(low)}. Whether you can afford it ${depends}`;
  }
  const count = spelled(homes.length);
  if (low === high) {
    return `Those ${count} homes are all asking ${formatCurrency(low)}. Which ones you can afford ${depends}`;
  }
  return `Those ${count} homes run from ${formatCurrency(low)} to ${formatCurrency(high)}. Which ones you can afford ${depends}`;
}

/**
 * The one question the conversation could not answer.
 *
 * Everything else on this page she has already told somebody. What she has not
 * said, and what nothing can be worked out without, is what she would be
 * selling. So this is the only place on any screen that asks for something new,
 * and it earns the ask by showing the free half of the answer first.
 *
 * The free half is a bracket, not a midpoint. Six sales is a range, and a
 * product that averages six sales into one confident number has turned a guess
 * into a promise. `shouldWithholdMidpoint` exists in the domain for exactly
 * this; here the design does it by drawing two figures with "to" between them.
 *
 * Pressing the button is the second place the wall stands. It is the same wall
 * as Save, for the same reason: she is asking us to keep something.
 */
export function BudgetBlock({
  context = false,
  homes = NO_HOMES,
  ceiling = null,
  onCeiling,
}: BudgetBlockProps) {
  const [address, setAddress] = useState("");
  const { signedIn, askForBudget, budgetWorked, soldAddress } = useAccount();
  /**
   * Once she has walked the steps the form has done its job, and what stands
   * in its place is the number the steps were for. Signed in by the
   * prototype's switch rather than by the steps, the block shows the worked
   * state too, because that is the state the boards draw for a signed-in
   * visitor; the address is then the sample one, and says so.
   */
  const worked = signedIn && (budgetWorked || address === "");
  const typed = soldAddress ?? (address.trim() || null);
  const sold = typed ?? SAMPLE_ADDRESS;
  const usingIt = ceiling === SEMI_WORKED.ceiling;

  return (
    <section
      id="budget"
      className="border-t border-hairline bg-sunken px-4 py-12 sm:px-6 sm:pt-13 sm:pb-14"
    >
      <div
        className={cn(
          "mx-auto grid w-full max-w-[1328px] grid-cols-1 gap-8",
          context
            ? "lg:grid-cols-[minmax(0,600px)_minmax(0,672px)] lg:gap-14"
            : "lg:grid-cols-1",
        )}
      >
        {/*
          Without the card the column stands alone, and it keeps the same
          measure it has beside the card. Prose at 1328px is 170 characters a
          line; the design's measure is sixty to seventy.
        */}
        <div className={cn("flex flex-col gap-5", !context && "max-w-[600px]")}>
          <h2 className="text-[22px]/[30px] font-semibold tracking-[-0.02em] text-ink sm:text-[32px]/[42px]">
            What can you actually spend?
          </h2>
          <p className="text-[15px]/[25px] text-ink-muted">{homesLine(homes)}</p>

          {worked ? (
            <div className="flex max-w-[520px] flex-col gap-4">
              <p className="text-[15px]/[25px] text-ink-muted">
                {sold}, worked out from six sales within 800 metres.
                {typed === null ? (
                  <span className="block font-mono text-[10px]/4 tracking-[0.09em] uppercase">
                    A sample address, for the prototype
                  </span>
                ) : null}
              </p>
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-[32px]/[40px] font-semibold tracking-[-0.02em] text-ink">
                  {formatCurrency(SEMI_WORKED.value.value)}
                </span>
                <span className="text-[15px]/[25px] text-ink-muted">
                  is what your semi is worth
                </span>
              </p>
              <p className="text-[15px]/[25px] text-ink">
                That leaves a ceiling of about{" "}
                <strong className="font-semibold">
                  {formatCurrency(SEMI_WORKED.ceiling)}
                </strong>{" "}
                for the next house.
              </p>
              {onCeiling ? (
                usingIt ? (
                  <p className="text-[13px]/[21px] text-ink-muted">
                    Your search already uses it.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => onCeiling(SEMI_WORKED.ceiling)}
                    className="h-12 w-fit rounded-xl bg-ink px-5 text-[15px]/6 font-medium text-white"
                  >
                    Use it as my ceiling
                  </button>
                )
              ) : null}
            </div>
          ) : (
            <>
          <p className="text-[15px]/[25px] text-ink-muted">
            Put the address in. We work out the rest and show you what we
            assumed.
          </p>

          <form
            className="flex max-w-[420px] flex-col gap-3 pt-1"
            onSubmit={(event) => {
              event.preventDefault();
              // The same wall as Save, and it says so in her words rather than
              // ours: she is asking us to work something out and keep it.
              askForBudget(address);
            }}
          >
            <label>
              <span className="sr-only">The address you would sell</span>
              <input
                id="sell-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter the address you would sell"
                className="h-14 w-full rounded-xl border-[1.5px] border-ink bg-background px-[18px] text-[15px]/6 text-ink outline-none placeholder:text-ink-muted focus:border-action"
              />
            </label>
            <button
              type="submit"
              className="h-14 rounded-xl bg-ink px-4 text-[15px]/6 font-medium text-white"
            >
              Work out my budget
            </button>
          </form>

          <p className="text-[13px]/[21px] text-ink-muted">
            About a minute. We ask for an email so we can send it to you. No
            phone number, and no agent is called.
          </p>
            </>
          )}
        </div>

        {context ? (
          <div className="flex flex-col rounded-2xl border border-hairline bg-background p-5 sm:px-[30px] sm:py-7">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-3.5">
              <p className="text-[15px]/[22px] font-semibold text-ink">
                {worked ? `Your semi, at ${sold}` : SEMI_BRACKET.title}
              </p>
              <p className="text-[13px]/[20px] text-ink-muted">
                {SEMI_BRACKET.detail}
              </p>
            </div>

            {worked ? (
              <p className="pb-3 text-[28px]/[36px] font-semibold tracking-[-0.02em] text-ink sm:text-[31px]/[40px]">
                {formatCurrency(SEMI_WORKED.value.value)}
              </p>
            ) : (
              <p className="flex flex-wrap items-baseline gap-x-2.5 pb-3">
                <span className="text-[28px]/[36px] font-semibold tracking-[-0.02em] text-ink sm:text-[31px]/[40px]">
                  {formatCurrency(SEMI_BRACKET.low.value)}
                </span>
                <span className="text-[15px]/[36px] text-ink-muted sm:text-[15px]/[40px]">
                  to
                </span>
                <span className="text-[28px]/[36px] font-semibold tracking-[-0.02em] text-ink sm:text-[31px]/[40px]">
                  {formatCurrency(SEMI_BRACKET.high.value)}
                </span>
              </p>
            )}

            {/*
              Five pips, three lit, drawn by hand because the design draws
              five. The label does the work the pips cannot: it says "a range,
              not one number" in words, which is the honest half of a meter.
            */}
            <p className="flex flex-wrap items-center gap-3 pb-4">
              <span aria-hidden className="flex items-center gap-1">
                {Array.from({ length: SEMI_BRACKET.of }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 w-[26px] rounded-[2px]",
                      i < (worked ? SEMI_WORKED.filled : SEMI_BRACKET.filled)
                        ? "bg-warm"
                        : "bg-hairline",
                    )}
                  />
                ))}
              </span>
              <span className="text-[13px]/[20px] text-ink-muted">
                {worked ? SEMI_WORKED.confidence : SEMI_BRACKET.confidence}
              </span>
            </p>

            <p className="pb-5 text-[13px]/[21px] text-ink-muted">
              {worked ? SEMI_WORKED.body : SEMI_BRACKET.body}
            </p>

            <hr className="mb-5 border-hairline" />

            <p className="pb-1.5 text-[14px]/[22px] font-medium text-ink">
              {worked
                ? "What it rests on, and you can change any of them"
                : "Then we work these out, and you can change any of them"}
            </p>
            <p className="pb-3.5 text-[13px]/[21px] text-ink-muted">
              What you put down and what you can pay each month move the answer
              most.
            </p>
            <div className="flex flex-wrap gap-2">
              {(worked ? SEMI_WORKED.inputs : SEMI_BRACKET.inputs).map((input) => (
                <span
                  key={input.label}
                  className={cn(
                    "flex items-center gap-[7px] rounded-full px-3.5 py-[9px] text-[13px]/[20px]",
                    worked
                      ? "border border-hairline-strong bg-background text-ink-body"
                      : "bg-sunken text-ink-muted",
                  )}
                >
                  {input.label}
                  <span className={cn("font-medium", worked ? "text-ink" : "text-ink-faint")}>
                    {input.value}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
