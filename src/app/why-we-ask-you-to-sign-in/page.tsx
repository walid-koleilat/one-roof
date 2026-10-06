import Link from "next/link";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";

export const metadata = {
  title: "Why we ask you to sign in",
  description:
    "The two places on this prototype that ask for an account, and why everything else stays open.",
};

/**
 * The reasoning behind the wall, written out once.
 *
 * The login wall is the most-complained-about thing in this product, and a
 * prototype that moves it without explaining where it went has not made an
 * argument. This page is the argument: what stays open, what does not, and
 * why the line falls exactly where it falls.
 *
 * It is deliberately plain. No illustration, no diagram - the claim is simple
 * enough to be checked by reading it.
 */
export default function WhyPage() {
  return (
    <main className="min-h-dvh bg-background pb-[var(--tour-inset,0px)]">
      <SiteNav active="Buying" savedCount={null} />

      <article className="mx-auto flex w-full max-w-[680px] flex-col gap-7 px-5 py-12 sm:py-16">
        <header className="flex flex-col gap-3">
          <h1 className="text-[28px]/[38px] font-semibold tracking-[-0.02em] text-ink sm:text-[36px]/[46px]">
            Why we ask you to sign in
          </h1>
          <p className="text-base/[26px] text-ink-body">
            Once, at one moment, for one reason. Here is the whole of it.
          </p>
        </header>

        <Block title="Everything you can see stays free">
          Every price, permit line, drive time and sold figure on this site is
          open. You can search, draw an area, change your mind and read all
          thirty-one homes without telling us anything. That is not a trial.
          It is the product.
        </Block>

        <Block title="Saved is different, because it is yours">
          A saved home has to survive you closing the laptop. It has to still be
          there on Tuesday when the price moves. It has to reach the people
          moving in with you. None of that works against a browser that forgets
          you, so the account is for the things you make, not the things you
          look at.
        </Block>

        <Block title="The wall stands at the first press of Save">
          Not on the landing page, not on the search page, not in front of a
          permit record. If you never save anything, we never ask you anything.
          The moment you press Save you are asking us to remember something,
          and that is the moment it is fair to ask who you are.
        </Block>

        <Block title="It never takes you off the page">
          The panel opens over whatever you were reading, the home you pressed
          Save on is the first thing in it, and when it closes you are exactly
          where you were with the home now yours. A sign-up that throws away
          what you were doing is a sign-up you abandon.
        </Block>

        <Block title="It confirms rather than interviews">
          Four of the five things most sign-ups ask, the conversation already
          answered. So we show them back for you to correct instead of asking
          again. The only new question is the one nothing else could answer:
          what would you be selling.
        </Block>

        <Block title="Nothing you tell us reaches an agent">
          Not your email, not your timing, not what you saved. We are paid when
          an agent subscribes, not when you pick one. The day that changes is
          the day this page stops being true.
        </Block>

        <Link
          href="/homes-with-a-suite"
          className="self-start rounded-full bg-ink px-5 py-2.5 text-[13px]/[19px] font-semibold text-white"
        >
          Back to the homes
        </Link>
      </article>

      <SiteFooter note="This page describes the rule. The rule is enforced in the code." />
    </main>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 border-l-2 border-action pl-5">
      <h2 className="text-[17px]/[25px] font-semibold text-ink">{title}</h2>
      <p className="text-[15px]/[25px] text-ink-body">{children}</p>
    </section>
  );
}
