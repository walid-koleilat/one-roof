import { StatusChip } from "@/components/status-chip";
import { priceDelta } from "@/lib/domain/listing";
import type { Sourced } from "@/lib/domain/provenance";

/**
 * "$14k under". The comparison is to our own estimate, never to another
 * listing, and the component says so in its title attribute rather than
 * leaving the reader to assume.
 *
 * Tone is not a judgement. `under` is warm-neutral teal because "below our
 * estimate" is information, not a bargain, and a green chip would be the
 * product cheering for a purchase it has no business cheering for.
 */
export function PriceDeltaChip({
  askingPrice,
  ourEstimate,
}: {
  askingPrice: Sourced<number>;
  ourEstimate: Sourced<number>;
}) {
  const delta = priceDelta(askingPrice.value, ourEstimate.value);
  return (
    <StatusChip
      tone={delta.tone === "at" ? "flat" : delta.tone === "under" ? "action" : "warm"}
      size="sm"
      className="rounded-full px-2"
      title="Compared to our own estimate, not to the asking price of anything else."
    >
      {delta.label}
    </StatusChip>
  );
}
