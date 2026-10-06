import type { Metadata } from "next";
import { assessConfidence, BAND_COPY, BAND_ORDER } from "@/lib/domain/confidence";
import { valueBlock } from "@/lib/domain/value-block";
import { compare } from "@/lib/domain/signal";
import {
  formatCount,
  formatCurrency,
  formatDays,
  formatMonths,
  formatRange,
  formatSignedPercent,
} from "@/lib/domain/format";
import { COHORT_DECLINE, DAYS_ON_MARKET, REGION_SNAPSHOT, SUPPLY } from "@/data/market";
import { COMPS_PROVENANCE, SAMPLE_COMPS } from "@/data/comps";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/status-chip";
import { ProvenanceTag } from "@/components/provenance-tag";
import { ConfidenceBand, ConfidenceMeter } from "@/components/confidence-band";
import { NumberPair } from "@/components/number-pair";
import { SourcedStat } from "@/components/sourced-number";
import { ValueBlockCard } from "@/components/value-block";
import { CompTable } from "@/components/comp-table";
import { AssistantMessage } from "@/components/assistant-message";
import { DisclosureLadder } from "@/components/disclosure-ladder";
import { SegmentedSearch } from "@/components/segmented-search";
import { ValuationFigure } from "@/components/valuation-figure";
import { AgencyDemo } from "./agency-demo";

export const metadata: Metadata = {
  title: "Design system",
  description:
    "The components the prototype is built from, with the rules that constrain them.",
};

const AS_OF = new Date("2026-09-06");
const confidence = assessConfidence({ comparables: SAMPLE_COMPS, asOf: AS_OF });

/** One bracket, rendered at three confidence levels, so only the band varies. */
const RANGE = { midpoint: 586_000, low: 568_000, high: 604_000 };

const estimate = valueBlock({
  label: "Estimated value",
  figure: formatRange(568_000, 604_000),
  verdict: BAND_COPY[confidence.band].verdict,
  comparison: "About 11% below the 416 condo average, which is a two-bed number.",
  contributors: [
    { label: "One-bed cohort since 2022", detail: "-26.9%", effect: "hurts" },
    { label: "Parking space included", detail: "+$38,000", effect: "helps" },
    { label: "Two same-building sales", detail: "within 10%", effect: "helps" },
    { label: "Completed and unsold supply", detail: "5,001 units", effect: "hurts" },
  ],
  instruction:
    "List at $579,000 if you have to close before March. Holding past 2027 is the only version of this where waiting pays.",
});

export default function DesignSystemPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-16">
      <header className="flex flex-col gap-4">
        <StatusChip tone="authority" size="sm" className="uppercase">
          Internal
        </StatusChip>
        <h1 className="text-display font-semibold text-balance text-ink">
          The components this prototype is built from
        </h1>
        <p className="max-w-2xl text-lede text-ink-body">
          Every component here encodes a rule from the brief. The rules are in
          the props: a figure cannot render without provenance, a value block
          cannot render without an instruction, and the assistant has no prop
          for a greeting.
        </p>
      </header>

      <Section
        title="Colour"
        rule="Slate blue says this counts, and slate ink is sold. Green and red are darkened until they pass as text. Confidence is never red, because absent data is not an error."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Swatch className="bg-action" name="action" hex="#2F5FB3" dark />
          <Swatch className="bg-action-deep" name="action-deep" hex="#234A8C" dark />
          <Swatch className="bg-authority" name="authority" hex="#3A3F4B" dark />
          <Swatch className="bg-warm" name="warm" hex="#EE802B" dark />
          <Swatch className="bg-up" name="up" hex="#2F7D32" dark />
          <Swatch className="bg-down" name="down" hex="#C62828" dark />
          <Swatch className="bg-ink" name="ink" hex="#16181A" dark />
          <Swatch className="bg-ink-muted" name="ink-muted" hex="#6B7075" dark />
          <Swatch className="bg-action-tint" name="action-tint" hex="#EAF0FA" />
          <Swatch className="bg-authority-tint" name="authority-tint" hex="#ECEDF1" />
          <Swatch className="bg-warm-tint" name="warm-tint" hex="#FFF1E8" />
          <Swatch className="bg-sunken" name="sunken" hex="#F6F7F7" />
        </div>
      </Section>

      <Section
        title="Type"
        rule="Nine steps, three of them numeric, because every screen leads with a figure. Poppins at three weights."
      >
        <div className="flex flex-col gap-4 rounded-lg border border-hairline p-6">
          <TypeRow token="text-number" className="text-number">$586,000</TypeRow>
          <TypeRow token="text-display" className="text-display">Buying a multigenerational home</TypeRow>
          <TypeRow token="text-title" className="text-title">What your unit is worth</TypeRow>
          <TypeRow token="text-lede" className="text-lede">You are not looking at the market you bought in.</TypeRow>
          <TypeRow token="text-section" className="text-section">Comparable sales</TypeRow>
          <TypeRow token="text-sm" className="text-sm">Body copy, and the caveats that go under a number.</TypeRow>
        </div>
      </Section>

      <Section
        title="Status chip"
        rule="One chip, seven tones. Tone is semantic. Down means the market fell, not that the reader failed."
      >
        <div className="flex flex-wrap gap-2">
          <StatusChip tone="action">Action</StatusChip>
          <StatusChip tone="authority">Authority</StatusChip>
          <StatusChip tone="warm">Derived figure</StatusChip>
          <StatusChip tone="up">+4.2%</StatusChip>
          <StatusChip tone="down">-26.9%</StatusChip>
          <StatusChip tone="neutral">Sold July 18, 2026</StatusChip>
          <StatusChip tone="outline">TRREB, 2026-08</StatusChip>
        </div>
      </Section>

      <Section
        title="Provenance tag"
        rule="Published sources get a quiet credential. Derived and mock figures get the warm tone and a tooltip carrying the method."
      >
        <div className="flex flex-wrap gap-2">
          <ProvenanceTag provenance={REGION_SNAPSHOT["416"].averagePrice.provenance} />
          <ProvenanceTag provenance={COHORT_DECLINE["one-bed"].provenance} />
          <ProvenanceTag provenance={COMPS_PROVENANCE} />
          <ProvenanceTag
            provenance={{ kind: "computed", from: ["your comps", "TRREB benchmark"] }}
          />
        </div>
      </Section>

      <Section
        title="Confidence"
        rule="Four bands, decided only by assessConfidence. The reasons render in full and are never collapsed."
      >
        <div className="flex flex-wrap items-center gap-6">
          {BAND_ORDER.map((band) => (
            <div key={band} className="flex items-center gap-2">
              <ConfidenceMeter band={band} />
              <span className="text-xs text-ink-muted">{band}</span>
            </div>
          ))}
        </div>
        <ConfidenceBand band={confidence.band} reasons={confidence.reasons} />
        <ConfidenceBand
          band="insufficient"
          reasons={[
            "No comparable sales found for this unit type in this building or area.",
          ]}
        />
      </Section>

      <Section
        title="Number pair"
        rule="No figure ships alone. A reader without a baseline invents one, and it is always what they paid in 2022."
      >
        <div className="grid gap-8 sm:grid-cols-2">
          <SourcedStat
            label="416 average condo price"
            value={REGION_SNAPSHOT["416"].averagePrice}
            format={formatCurrency}
            baseline={{ label: "the 905 average", value: REGION_SNAPSHOT["905"].averagePrice.value }}
            caption="A GTA average is close to meaningless on its own."
          />
          <SourcedStat
            label="One-bed cohort since 2022"
            value={COHORT_DECLINE["one-bed"]}
            format={formatSignedPercent}
            baseline={{ label: "the GTA average", value: REGION_SNAPSHOT["416"].yearOverYear.value }}
            polarity="higher-is-better"
            unit="ratio"
          />
          <SourcedStat
            label="Days on market"
            value={DAYS_ON_MARKET}
            format={formatDays}
            baseline={{ label: "a normal spring", value: 21 }}
            polarity="lower-is-better"
            size="sm"
          />
          <NumberPair
            label="Completed and unsold"
            figure={formatCount(SUPPLY.completedAndUnsold.value)}
            size="sm"
            verdict={compare({
              value: SUPPLY.completedAndUnsold.value,
              baseline: 2_977,
              baselineLabel: "last year",
              polarity: "lower-is-better",
            })}
          >
            <ProvenanceTag provenance={SUPPLY.completedAndUnsold.provenance} />
          </NumberPair>
        </div>
      </Section>

      <Section
        title="Value block"
        rule="Five layers: figure, verdict, contributors, comparison, instruction. The instruction is a required field, so this component cannot render a bare number."
      >
        <ValueBlockCard
          block={estimate}
          band={confidence.band}
          provenance={<ProvenanceTag provenance={COMPS_PROVENANCE} />}
        />
      </Section>

      <Section
        title="Valuation figure — Certainty"
        rule="Takes a Valuation, not a formatted string, and asks the domain layer what precision it has earned. There is no prop for overriding the answer, so a midpoint cannot reach the screen from an insufficient band."
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <ValuationFigure
            valuation={{ ...RANGE, band: "high", reasons: confidence.reasons, comparables: SAMPLE_COMPS, asOf: "2026-09-06" }}
            provenance={<ProvenanceTag provenance={COMPS_PROVENANCE} />}
          />
          <ValuationFigure
            valuation={{
              ...RANGE,
              band: "moderate",
              reasons: [
                "Recent sales disagree with each other by 15%, which is wide enough that the midpoint is not a strong signal.",
                "No recent sales in this building, so the range leans on nearby buildings that may not price the same way.",
              ],
              comparables: SAMPLE_COMPS,
              asOf: "2026-09-06",
            }}
            provenance={<ProvenanceTag provenance={COMPS_PROVENANCE} />}
          />
          <ValuationFigure
            valuation={{
              ...RANGE,
              band: "insufficient",
              reasons: [
                "Only 2 recent comparable sales - too few to place a reliable range around.",
              ],
              comparables: [],
              asOf: "2026-09-06",
            }}
          />
        </div>
      </Section>

      <Section
        title="Declaration and choice — Agency"
        rule="What the default assumes, said out loud and attributed to us. The choice stays visible after it is made, the consequence of each answer is shown, and the undo sits next to the answer rather than behind a back button. Try it."
      >
        <AgencyDemo />
      </Section>

      <Section
        title="Comparable sales"
        rule="The signed adjustments are shown. That is the part every competitor hides, and it is what makes the range survive a conversation with a lawyer."
      >
        <CompTable comparables={SAMPLE_COMPS} />
        <CompTable comparables={[]} />
      </Section>

      <Section
        title="Assistant"
        rule="Opens with a position, not a greeting. Names the condition that flips the answer. Asks only what would change the output."
      >
        <AssistantMessage
          position="Selling now costs you about $34,000 against holding to 2027, and holding costs you about $16,000 in carry over the same period. If the deadline is real, sell."
          basis={
            <div className="grid gap-6 sm:grid-cols-2">
              <SourcedStat
                label="Monthly carry gap"
                value={SUPPLY.monthlyCarryGap}
                format={formatCurrency}
                size="sm"
              />
              <SourcedStat
                label="Months of inventory"
                value={REGION_SNAPSHOT["416"].monthsOfInventory}
                format={formatMonths}
                baseline={{ label: "a balanced market", value: 4 }}
                polarity="lower-is-better"
                size="sm"
              />
            </div>
          }
          condition="you can carry the unit past 2027 without borrowing against it. CMHC expects prices to resume growth once completions taper, and that is the only version of this where waiting pays."
          question="How fast is the clock, actually?"
          actions={
            <>
              <Button variant="outline">It has to be sold now</Button>
              <Button variant="outline">Within six months</Button>
              <Button variant="outline">I can hold</Button>
            </>
          }
        />
      </Section>

      <Section
        title="Disclosure ladder"
        rule="Discloses depth, never access. Qualification does not gate data that is free today."
      >
        <DisclosureLadder
          defaultOpen={["claim"]}
          rungs={[
            {
              id: "claim",
              title: "Your unit type fell four times harder than the headline",
              teaser: "The claim",
              content:
                "One-bedroom units are down 26.9% since 2022. The GTA condo average is down 2.1% year over year. Those are not the same market.",
            },
            {
              id: "evidence",
              title: "Where that comes from",
              teaser: "The evidence",
              content: (
                <div className="flex flex-wrap gap-2">
                  <ProvenanceTag provenance={COHORT_DECLINE["one-bed"].provenance} />
                  <ProvenanceTag provenance={REGION_SNAPSHOT["416"].yearOverYear.provenance} />
                </div>
              ),
            },
            {
              id: "material",
              title: "The sales the range is built on",
              teaser: "The raw material",
              content: <CompTable comparables={SAMPLE_COMPS.slice(0, 3)} />,
            },
          ]}
        />
      </Section>

      <Section
        title="Segmented search"
        rule="Asks for the three things every later screen depends on, and shows what you have already told it. Never a fourth question to unlock a free figure."
      >
        <SegmentedSearch
          defaultOpenId="unit"
          segments={[
            {
              id: "address",
              label: "Your unit",
              value: "88 Blue Jays Way, Unit 2109",
              placeholder: "Address and unit number",
              field: <p className="text-sm text-ink-muted">Address lookup goes here.</p>,
            },
            {
              id: "unit",
              label: "What it is",
              placeholder: "One bedroom, parking, no locker",
              field: (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">Bachelor</Button>
                  <Button variant="outline" size="sm">One bedroom</Button>
                  <Button variant="outline" size="sm">One bedroom + den</Button>
                  <Button variant="outline" size="sm">Two bedroom</Button>
                </div>
              ),
            },
            {
              id: "clock",
              label: "The clock",
              placeholder: "How long you have",
              field: (
                <p className="text-sm text-ink-muted">
                  Declared, never inferred. Nothing here is guessed from what you
                  searched for.
                </p>
              ),
            },
          ]}
          action={<Button className="w-full sm:w-auto">See the number</Button>}
        />
      </Section>
    </main>
  );
}

function Section({
  title,
  rule,
  children,
}: {
  title: string;
  rule: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5 border-b border-hairline pb-4">
        <h2 className="text-title font-semibold text-ink">{title}</h2>
        <p className="max-w-2xl text-sm text-ink-muted">{rule}</p>
      </div>
      {children}
    </section>
  );
}

function Swatch({
  className,
  name,
  hex,
  dark = false,
}: {
  className: string;
  name: string;
  hex: string;
  dark?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-hairline">
      <div className={`${className} flex h-20 items-end p-3`}>
        <span
          className={`text-xs font-medium ${dark ? "text-white" : "text-ink"}`}
        >
          {hex}
        </span>
      </div>
      <p className="bg-background px-3 py-2 text-xs text-ink-muted">{name}</p>
    </div>
  );
}

function TypeRow({
  token,
  className,
  children,
}: {
  token: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-hairline pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-ink-faint">{token}</span>
      <span className={`${className} text-ink`}>{children}</span>
    </div>
  );
}
