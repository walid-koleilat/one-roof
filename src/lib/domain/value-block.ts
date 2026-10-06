/**
 * The five-layer anatomy every headline figure in this product must have.
 *
 * Taken from Whoop's score card, which never shows a number without also
 * showing what moved it and what to do next. A typical portal estimate
 * shows layer one and stops, which is why the brief grades it C-.
 *
 *   1. figure       - the number itself
 *   2. verdict      - one word, so the reader knows the answer before reading
 *   3. contributors - what moved it, ranked, capped
 *   4. comparison   - what it is being measured against
 *   5. instruction  - what to do about it
 *
 * Layer five is a required field. A block without an instruction is a
 * statistic, and this product is not for people who need more statistics.
 */

/** Beyond this the list stops being a ranking and starts being a data dump. */
export const MAX_CONTRIBUTORS = 4;

export interface Contributor {
  /** What moved the figure. Two or three words. */
  label: string;
  /** How much, in the reader's units. "-26.9% since 2022". */
  detail: string;
  /** Whether this contributor helped or hurt. Drives colour only. */
  effect?: "helps" | "hurts" | "neutral";
}

export interface ValueBlock {
  /** Layer 1. Pre-formatted, because precision is a domain decision. */
  figure: string;
  /** What the figure is. "Estimated value", "Days on market". */
  label: string;
  /** Layer 2. One word. Enforced at runtime because types cannot count words. */
  verdict: string;
  /** Layer 3, ranked most important first, truncated at MAX_CONTRIBUTORS. */
  contributors: Contributor[];
  /** Layer 4. Null only when there is honestly nothing to compare against. */
  comparison: string | null;
  /** Layer 5. Never optional. */
  instruction: string;
}

export interface ValueBlockInput extends Omit<ValueBlock, "contributors"> {
  contributors?: Contributor[];
}

export class ValueBlockError extends Error {}

/**
 * Builds a block and refuses to build an incomplete one.
 *
 * This throws rather than degrading, because a silently instruction-less block
 * looks fine in review and ships as a bare number. Loud is the point.
 */
export function valueBlock(input: ValueBlockInput): ValueBlock {
  const instruction = input.instruction.trim();
  if (instruction.length === 0) {
    throw new ValueBlockError(
      `Value block "${input.label}" has no instruction. A figure the reader cannot act on does not get a block.`,
    );
  }

  const verdict = input.verdict.trim();
  if (verdict.split(/\s+/).length > 2) {
    throw new ValueBlockError(
      `Value block "${input.label}" has a verdict of "${verdict}". The verdict is one word, two at the outside - it is read before the figure, not after it.`,
    );
  }

  return {
    figure: input.figure,
    label: input.label,
    verdict,
    contributors: (input.contributors ?? []).slice(0, MAX_CONTRIBUTORS),
    comparison: input.comparison,
    instruction,
  };
}

/** True when the block was given more contributors than it will show. */
export function wasTruncated(input: ValueBlockInput): boolean {
  return (input.contributors?.length ?? 0) > MAX_CONTRIBUTORS;
}
