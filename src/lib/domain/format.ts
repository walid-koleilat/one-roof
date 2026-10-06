/**
 * Formatting lives in the domain layer, not in components, because how a
 * figure is written is part of what the user is told. "$650k" and "$651,648"
 * make different promises about precision, and the choice belongs next to the
 * rules that decide how much precision we are entitled to claim.
 *
 * Everything here is ASCII. A minus sign that renders as a box in one font and
 * a dash in another is not worth the typographic upgrade on a screen whose
 * whole job is being quoted back to a lawyer.
 */

const CAD = "en-CA";

/** Exact dollars. Use where the figure will be argued over. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(CAD, {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Rounded dollars for scanning. Never use this in the same block as an exact
 * figure - two precisions side by side read as two different numbers.
 *
 * Thousands take a lower-case k, because the card's delta chip reads
 * "$14k under" on the board and a capital K beside a lower-case "under"
 * shouts. Millions keep the capital: design.md writes "$1.29M" and nothing
 * on a card ever reaches it.
 */
export function formatCurrencyCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${trimZero(value / 1_000_000)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return formatCurrency(value);
}

function trimZero(n: number): string {
  const s = n.toFixed(2);
  return s.replace(/\.?0+$/, "");
}

/** A ratio as a percentage. 0.021 -> "2.1%". Sign is dropped. */
export function formatPercent(ratio: number, digits = 1): string {
  return `${Math.abs(ratio * 100).toFixed(digits)}%`;
}

/** A ratio with its sign kept. -0.076 -> "-7.6%". Zero is unsigned. */
export function formatSignedPercent(ratio: number, digits = 1): string {
  const pct = ratio * 100;
  const rounded = Number(pct.toFixed(digits));
  if (rounded === 0) return `${(0).toFixed(digits)}%`;
  return `${rounded > 0 ? "+" : "-"}${Math.abs(rounded).toFixed(digits)}%`;
}

/** A signed dollar delta. Used for comp adjustments, which are always signed. */
export function formatSignedCurrency(value: number): string {
  if (value === 0) return formatCurrency(0);
  return `${value > 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
}

/**
 * A price range. Written with "to" rather than a dash because a dash between
 * two dollar figures reads as a subtraction on a small screen.
 */
export function formatRange(low: number, high: number): string {
  return `${formatCurrency(low)} to ${formatCurrency(high)}`;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

/** "2026-08" -> "August 2026". Accepts a full date and ignores the day. */
export function formatMonthYear(iso: string): string {
  const [year, month] = iso.split("-");
  const index = Number(month) - 1;
  const name = MONTHS[index];
  if (!year || !name) return iso;
  return `${name} ${year}`;
}

/** "2026-08-14" -> "August 14, 2026". */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  const index = Number(month) - 1;
  const name = MONTHS[index];
  if (!year || !name || !day) return iso;
  return `${name} ${Number(day)}, ${year}`;
}

/** Thousands separators, no currency. */
export function formatCount(value: number): string {
  return new Intl.NumberFormat(CAD).format(value);
}

/** "35 days", "1 day". Pluralisation is a rendering decision, so it lives here. */
export function formatDays(days: number): string {
  return `${formatCount(days)} ${days === 1 ? "day" : "days"}`;
}

/** "5.6 months". One decimal, because months of inventory is never an integer. */
export function formatMonths(months: number): string {
  return `${months.toFixed(1)} months`;
}

const WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
] as const;

/**
 * Small counts as words, larger ones as digits.
 *
 * A sentence that opens on a numeral reads as a spreadsheet cell, and the
 * advert's sub-line opens on a count. Twelve is the cut-off because past it
 * the word is longer than the number and stops being easier to read.
 */
export function spelled(n: number): string {
  return WORDS[n] ?? String(n);
}

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
] as const;
const TEENS = [
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
] as const;

/**
 * Any count under a thousand as words, for the one place a number opens a
 * sentence.
 *
 * `spelled` stops at twelve because past it the word is longer than the
 * figure. That rule is right mid-sentence and wrong at the start of one: a
 * headline that opens "19 in Bendale" reads as a spreadsheet cell, and the
 * design writes "Nineteen in Bendale". Capitalised, because the only caller
 * is a sentence opening; past 999 it gives up and hands back the figure.
 */
export function spelledOut(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999) return String(n);
  const words = (m: number): string => {
    if (m < 10) return WORDS[m]!;
    if (m < 20) return TEENS[m - 10]!;
    if (m < 100) {
      const rest = m % 10;
      return rest ? `${TENS[Math.floor(m / 10)]}-${WORDS[rest]}` : TENS[Math.floor(m / 10)]!;
    }
    const rest = m % 100;
    return rest
      ? `${WORDS[Math.floor(m / 100)]} hundred and ${words(rest)}`
      : `${WORDS[Math.floor(m / 100)]} hundred`;
  };
  const out = words(n);
  return out.charAt(0).toUpperCase() + out.slice(1);
}
