import Link from "next/link";
import { Exit } from "@/components/exit-hint";
import { ListingCard } from "@/components/listing-card";
import { agentMattersFor, agentsInOrder, mattersFor } from "@/lib/domain/matters";
import { MatterRow } from "@/components/matter-row";
import { DECLARED, UNDECLARED } from "@/data/criteria";
import { AGENTS } from "@/data/agents";
import { WIDGET_LISTINGS } from "@/data/listings";

/**
 * The One Roof app widget. This one may name a house.
 *
 * The difference from the ad above it is not visual, it is legal and it is the
 * point of the screen. She typed `@One Roof` and asked a question about three
 * specific homes. That is a person asking One Roof for One Roof's data
 * inside an app she has connected, which is a different act from an ad slot
 * pushing inventory at a stranger. So addresses appear, photographs appear,
 * and the permit answer is given.
 *
 * Three things this widget does that a lead form would not:
 *
 *   - It answers the question that was asked. Two of three have a permit.
 *   - It names the third rather than returning two results and letting her
 *     assume the missing one failed for some reason she would have to guess.
 *   - It states what a permit on file actually is. A city record, not a
 *     document anyone here has read, because claiming otherwise is the kind of
 *     small overreach that costs somebody a deposit.
 */
export function AppWidget() {
  return (
    <section
      aria-label="One Roof results"
      className="@container flex flex-col overflow-hidden rounded-3xl border border-[#E5E5E5] bg-background"
    >
      <CriteriaBar />

      {/* Same rule as the advert. See the note there. */}
      <div className="flex flex-col gap-3 p-4 @min-[520px]:flex-row @min-[520px]:snap-x @min-[520px]:snap-mandatory @min-[520px]:overflow-x-auto @min-[520px]:[scrollbar-width:none] @min-[520px]:[&::-webkit-scrollbar]:hidden">
        {WIDGET_LISTINGS.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            density="widget"
            className="w-full @min-[520px]:w-[235px] @min-[520px]:shrink-0 @min-[520px]:snap-start"
            matters={mattersFor(listing)}
          />
        ))}
      </div>

      {/*
        The same line the advert carries, because the widget now shows the same
        generated interiors as evidence behind each claim. An image offered as
        proof of something owes the reader this; an image offered as scenery
        arguably does not.
      */}
      <div className="px-[18px] pb-3.5">
        <p className="text-xs/[18px] text-ink-muted">
          Interiors behind each claim are illustrations, not photographs of
          these homes. Drive times are measured from each front door.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ECECEC] px-[18px] py-3.5">
        <p className="text-[13px]/[19px] font-medium text-ink">
          Three with a second kitchen and a record at the city
        </p>
        <Exit>
          <Link
            href="/homes-with-a-suite"
            className="flex items-center gap-1.5 rounded-full px-1 text-[13px]/[19px] font-semibold text-action-deep underline-offset-4 hover:underline"
          >
            See all four in One Roof
            <span aria-hidden>&rsaquo;</span>
          </Link>
        </Exit>
      </div>

      <div className="flex flex-col gap-3.5 border-t border-[#ECECEC] px-[18px] py-4">
        <h3 className="text-[15px]/[23px] font-semibold text-ink">
          Three agents who speak Tamil and have sold homes with a suite
        </h3>
        <div className="flex flex-col gap-3 @min-[520px]:flex-row @min-[520px]:snap-x @min-[520px]:snap-mandatory @min-[520px]:overflow-x-auto @min-[520px]:[scrollbar-width:none] @min-[520px]:[&::-webkit-scrollbar]:hidden">
          {/* The three who speak Tamil, because here she has just said so. */}
          {agentsInOrder(AGENTS, { language: "Tamil" }).slice(0, 3).map((agent) => (
            <article
              key={agent.id}
              className="flex w-full @min-[520px]:w-[235px] @min-[520px]:shrink-0 @min-[520px]:snap-start flex-col overflow-hidden rounded-xl bg-background"
            >
              <div
                className="h-[104px] bg-cover bg-[position:50%_30%]"
                style={{ backgroundImage: `url(${agent.photo})` }}
                role="img"
                aria-label={`${agent.name}, outside a house in Scarborough`}
              />
              <div className="flex flex-1 flex-col gap-2 px-3.5 pt-3 pb-3.5">
                <p className="text-[15px]/[21px] font-semibold text-ink">
                  {agent.name}
                </p>
                <p className="text-[13px]/[19px] text-ink-body">
                  {agent.languages}. {agent.note}
                </p>
                <p className="pt-0.5 font-mono text-[10px] tracking-[0.12em] text-ink-faint uppercase">
                  What matters to you
                </p>
                <ul className="flex flex-col gap-[7px] pt-0.5">
                  {agentMattersFor(agent, { language: "Tamil" }).map((m) => (
                    <MatterRow key={m.label} matter={m} valueAt="end" />
                  ))}
                </ul>
                <div className="mt-auto border-t border-[#ECECEC] pt-1.5">
                  <Rating rating={agent.rating} reviews={agent.reviews} />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/*
          The agents need a way out of their own, and it is deliberately not a
          link. It also does not say "contact" - the next thing she wants is
          evidence, not a phone call, and a directory that jumps straight to
          contact is a lead form wearing a rating. Everything clickable on this page rings teal when somebody
          clicks into the void, and a ringed control that goes nowhere teaches
          the wrong thing. So this states what the next step would be and says
          plainly that it is not wired up, which is more honest than a dead
          link styled to look live.
        */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-[#ECECEC] pt-3.5">
          <p className="text-[13px]/[19px] text-ink-muted">
            Ranked by sales and client reviews, not ad spend.
          </p>
          <p className="flex items-center gap-2">
            <span className="text-[13px]/[19px] font-semibold text-ink-muted">
              See their sales and read the reviews
            </span>
            <span className="rounded-full bg-sunken px-2 py-[3px] text-[11px]/[15px] font-medium text-ink-muted">
              Not in this prototype
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * A score with its sample size attached.
 *
 * Never the score alone. A 4.8 from eleven people and a 4.6 from ninety-six
 * are different claims, and putting the count in smaller type beside the star
 * is the least a directory owes somebody about to hand over the largest
 * decision of their year.
 */
function Rating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <p className="flex items-center gap-1.5">
      <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
        <path
          d="M8 1.6 L10 5.9 L14.6 6.5 L11.2 9.7 L12.1 14.3 L8 12.1 L3.9 14.3 L4.8 9.7 L1.4 6.5 L6 5.9 Z"
          fill="var(--ds-ink)"
        />
      </svg>
      <span className="text-xs/[18px] font-semibold text-ink">
        {rating.toFixed(1)}
      </span>
      <span className="text-xs/[18px] text-ink-muted">
        from {reviews} reviews
      </span>
    </p>
  );
}

/**
 * What the widget filtered on, said out loud before the results.
 *
 * Three cards under a sentence is an assertion that they came from what she
 * said. This is the working. Each chip carries a phrase she actually typed -
 * `criteria.test.ts` fails the build if one stops matching - and the dashed
 * slot at the end is the one condition nothing she said supports, left open
 * rather than guessed at.
 */
function CriteriaBar() {
  return (
    <div className="flex flex-col gap-2.5 border-b border-[#ECECEC] px-[18px] pt-[18px] pb-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px]/[19px] font-semibold text-ink">
          Built from what you told me
        </p>
        <span className="text-xs/[18px] font-medium text-action-deep">
          Change any of these
        </span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {DECLARED.map((c) => (
          <li
            key={c.id}
            title={`You said: "${c.said}"`}
            className="flex h-[30px] items-center gap-2 rounded-full border border-action bg-action-tint pr-2.5 pl-3 text-xs/[18px] font-semibold text-action-deep"
          >
            {c.label}
            <span aria-hidden className="text-[13px] leading-none opacity-70">
              &times;
            </span>
          </li>
        ))}
        <li
          title={UNDECLARED.why}
          className="flex h-[30px] items-center gap-1.5 rounded-full border border-dashed border-hairline-strong px-3.5 text-xs/[18px] font-medium text-ink-muted"
        >
          <span aria-hidden>+</span>
          {UNDECLARED.label}
        </li>
      </ul>
    </div>
  );
}
