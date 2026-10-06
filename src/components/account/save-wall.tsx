"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "@/components/wordmark";
import { LISTINGS } from "@/data/listings";
import { SAMPLE_ADDRESS } from "@/data/semi-bracket";
import { formatCurrency } from "@/lib/domain/format";
import { cn } from "@/lib/utils";

/**
 * The only question this product asks, and where it stands.
 *
 * It stands at Save, and nowhere earlier. Every price, permit line and drive
 * time on every page is open, because the thing this prototype is arguing
 * against is a login in front of data that is already free. Saved is
 * different: it is hers, it has to survive her closing the laptop, and it has
 * to reach the people she shares it with. So the search hands off with no gate
 * at all, and the wall stands at the first press of Save.
 *
 * It never navigates. The page stays behind this panel and the home she
 * pressed Save on is the first thing in it, so the reason she is being asked
 * is on screen while she is being asked. A sign-up that throws away the
 * context is a sign-up she abandons.
 *
 * Four steps, and only one of them is a question the chat could not already
 * answer.
 */

type Step = "email" | "link" | "about" | "confirm";

const REACH = ["Email only", "Email and text"] as const;
export const SAMPLE_EMAIL = "nirosha@example.com";
const LANGUAGES = ["English", "Tamil", "Cantonese", "Mandarin"] as const;

/** What the conversation already told us. Shown back, not asked again. */
const KNOWN = [
  { question: "Who is moving in", answer: "One home for us and my parents" },
  { question: "What else matters", answer: "Ageing parents, one after a fall" },
  { question: "When it has to happen", answer: "No deadline yet" },
  { question: "Where", answer: "Scarborough and the east end" },
] as const;

export function SaveWall({
  reason,
  listingId,
  address = null,
  onAddress,
  onCancel,
  onDone,
}: {
  /**
   * Which act brought her here. It changes the words, not the steps.
   *
   * "search" is the nudge bar: she has not pressed Save on anything, she is
   * keeping the search the chat set up. It is a save, so it takes the save
   * shape, but it is not a home and must not say it is one.
   */
  reason: "save" | "budget" | "search" | "signin";
  listingId?: string;
  /** The address she typed before the steps, if any. The budget steps ask for it otherwise. */
  address?: string | null;
  onAddress?: (address: string) => void;
  onCancel: () => void;
  onDone: (name: string) => void;
}) {
  const [step, setStep] = useState<Step>("email");
  // A sample address, already in the box, so a reviewer can walk the steps
  // without inventing one. It is the prototype's, and the line under the
  // box says so; anything typed over it is used instead.
  const [email, setEmail] = useState<string>(SAMPLE_EMAIL);
  const [sold, setSold] = useState<string>(address ?? SAMPLE_ADDRESS);
  const [name, setName] = useState("");
  const [reach, setReach] = useState<string>(REACH[0]);
  const [language, setLanguage] = useState<string>(LANGUAGES[0]);
  const listing = listingId ? LISTINGS.find((l) => l.id === listingId) : undefined;
  const budget = reason === "budget";
  const search = reason === "search";
  const signin = reason === "signin";

  // Nobody is going to check their email inside a prototype, so the link opens
  // itself. It is the one thing here that pretends, and it pretends in the
  // direction of less friction rather than more.
  useEffect(() => {
    if (step !== "link") return;
    const id = setTimeout(() => setStep("about"), 2400);
    return () => clearTimeout(id);
  }, [step]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        budget
          ? "Work out your budget"
          : search
            ? "Keep this search"
            : signin
              ? "Sign in"
              : "Save this home"
      }
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 px-3 pb-3 sm:items-center sm:p-6"
    >
      <div className="flex max-h-[92dvh] w-full max-w-[440px] flex-col overflow-y-auto rounded-2xl bg-background shadow-[0_24px_60px_-12px_rgba(22,24,26,0.45)]">
        <div className="flex items-center justify-between px-5 pt-4">
          <Wordmark width={104} />
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-2 py-1 text-[13px] font-medium text-ink-muted hover:text-ink"
          >
            Not now
          </button>
        </div>

        {/*
          What she was doing, kept on screen while she is asked.
          
          A sign-up that throws away the context is a sign-up she abandons, so
          either the home she pressed Save on or the bracket she asked us to
          narrow is the first thing inside the panel.
        */}
        {budget ? (
          <div className="mx-5 mt-3 flex flex-col gap-0.5 rounded-xl bg-sunken p-3">
            <span className="text-[12px]/[18px] text-ink-muted">
              A semi like yours, in Bendale
            </span>
            <span className="text-[15px]/[23px] font-semibold text-ink">
              $938,000 to $992,000
            </span>
            <span className="text-[12px]/[18px] text-ink-muted">
              Your own address turns this into one number.
            </span>
          </div>
        ) : null}
        {listing ? (
          <div className="mx-5 mt-3 flex items-center gap-3 rounded-xl bg-sunken p-2.5">
            <span
              role="img"
              aria-label=""
              className="size-12 shrink-0 rounded-lg bg-cover bg-center"
              style={{
                backgroundColor: listing.photoTint,
                backgroundImage: `url(${listing.photos[0]})`,
              }}
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm/5 font-semibold text-ink">
                {listing.address}
              </span>
              <span className="text-[13px]/[19px] text-ink-muted">
                {formatCurrency(listing.askingPrice.value)} · {listing.permit}
              </span>
            </span>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 p-5">
          {step === "email" ? (
            <>
              <Title>
                {budget
                  ? "Where should we send it?"
                  : search
                    ? "Keep this search"
                    : signin
                      ? "Sign in, or join"
                      : "Sign in to keep this one"}
              </Title>
              <p className="text-sm/[22px] text-ink-body">
                {budget
                  ? "It takes about a minute to work out. We email it to you so you still have it tomorrow."
                  : search
                    ? "Your four criteria, the area you drew, and anything you save into it. We will email you a link. There is no password to make up."
                    : signin
                      ? "One address does both. We email you a link, and there is no password to make up."
                      : "We will email you a link."}
              </p>
              {budget ? (
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px]/5 font-medium text-ink">The address you would sell</span>
                  <input
                    type="text"
                    value={sold}
                    onChange={(e) => setSold(e.target.value)}
                    placeholder="Enter the address you would sell"
                    className="rounded-lg border border-hairline-strong px-3.5 py-2.5 text-sm/5 text-ink outline-none placeholder:text-ink-faint focus:border-action"
                  />
                  {sold === SAMPLE_ADDRESS ? (
                    <span className="font-mono text-[10px]/3 tracking-[0.09em] text-ink-muted uppercase">
                      A sample address, filled in for the prototype
                    </span>
                  ) : null}
                </label>
              ) : null}
              <label className="flex flex-col gap-1.5">
                <span className="sr-only">Your email</span>
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="rounded-lg border border-hairline-strong px-3.5 py-2.5 text-sm/5 text-ink outline-none placeholder:text-ink-faint focus:border-action"
                />
                {email === SAMPLE_EMAIL ? (
                  <span className="font-mono text-[10px]/3 tracking-[0.09em] text-ink-muted uppercase">
                    A sample address, filled in for the prototype
                  </span>
                ) : null}
              </label>
              <Primary
                disabled={!email.includes("@") || (budget && sold.trim() === "")}
                onClick={() => {
                  if (budget) onAddress?.(sold.trim());
                  setStep("link");
                }}
              >
                {budget ? "Show me my number" : "Send me a link"}
              </Primary>
              <Fine>
                {budget
                  ? "It opens on the next screen as well as in your inbox. No phone number, and no agent is told your address."
                  : search
                    ? "We never sell your email. We write when something changes on a home you saved, and not otherwise."
                    : "No password to remember. We do not sell your email, and no agent is told you looked."}
              </Fine>
            </>
          ) : null}

          {step === "link" ? (
            <>
              <Title>Check your email</Title>
              <p className="text-sm/[22px] text-ink-body">
                We sent a link to <strong className="font-semibold">{email}</strong>.
                Open it on any device and you stay right here.
              </p>
              <p className="flex items-center gap-2 rounded-lg bg-action-tint px-3.5 py-2.5 text-[13px]/[19px] text-action-deep">
                <Spinner />
                Opening your link. Nothing you were looking at has moved.
              </p>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="self-start text-[13px]/[19px] font-medium text-ink underline underline-offset-2"
              >
                That is the wrong address
              </button>
            </>
          ) : null}

          {step === "about" ? (
            <>
              <Title>Almost there</Title>
              <p className="text-sm/[22px] text-ink-body">
                Three things and you are done.
              </p>

              <Field label="What should we call you?">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nirosha"
                  className="w-full rounded-lg border border-hairline-strong px-3.5 py-2.5 text-sm/5 text-ink outline-none placeholder:text-ink-faint focus:border-action"
                />
              </Field>

              <Field label="How should we reach you?">
                <Chips options={REACH} value={reach} onChange={setReach} />
              </Field>

              <Field label="Which language would you rather read?">
                <Chips
                  options={LANGUAGES}
                  value={language}
                  onChange={setLanguage}
                />
              </Field>

              <Primary onClick={() => setStep("confirm")}>Keep going</Primary>
              <Fine>
                We ask about language because the people you share this with
                may not read English. None of this goes to an agent.
              </Fine>
            </>
          ) : null}

          {step === "confirm" ? (
            <>
              <Title>We think we already know this</Title>
              <p className="text-sm/[22px] text-ink-body">
                From the conversation you had. Change anything that is wrong.
              </p>
              <ul className="flex flex-col divide-y divide-hairline rounded-xl border border-hairline">
                {KNOWN.map((row) => (
                  <li
                    key={row.question}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[11px]/4 text-ink-faint">
                        {row.question}
                      </span>
                      <span className="text-[13px]/[19px] font-medium text-ink">
                        {row.answer}
                      </span>
                    </span>
                    <span className="shrink-0 text-[13px]/[19px] font-medium text-action-deep underline underline-offset-2">
                      Change
                    </span>
                  </li>
                ))}
              </ul>
              <Primary onClick={() => onDone(name.trim() || "Nirosha")}>
                {budget
                  ? "That is right. Work it out"
                  : search
                    ? "That is right. Keep it"
                    : "That is right. Save it"}
              </Primary>
              <Fine>
                Most sign-ups ask all four of these. We are only checking,
                because you have answered them already.
              </Fine>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[19px]/[26px] font-semibold text-ink">{children}</h2>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px]/[19px] font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-[13px]/[19px] transition-colors",
            value === option
              ? "border-action bg-action-tint font-medium text-action-deep"
              : "border-hairline-strong text-ink-body hover:border-ink-faint",
          )}
        >
          {option}
        </button>
      ))}
    </span>
  );
}

function Primary({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-ink px-4 py-2.5 text-sm/5 font-semibold text-white disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function Fine({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px]/[17px] text-ink-faint">{children}</p>;
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" className="shrink-0 animate-spin motion-reduce:animate-none" aria-hidden>
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M8 2 A6 6 0 0 1 14 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
