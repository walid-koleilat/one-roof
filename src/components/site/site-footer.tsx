/**
 * The footer, drawn as bars rather than written as links.
 *
 * A real portal's footer is five columns of neighbourhood pages, and writing
 * sixty invented place names would be sixty invented claims for no gain. Grey
 * bars say "this is a real product's footer" without asserting anything, and
 * the one line that is written out is the line that matters: what this is, and
 * that nothing here has been sent to anybody.
 */

const COLUMNS = [
  "Scarborough neighbourhoods",
  "Toronto and the GTA",
  "Homes with a legal suite",
  "Multigenerational by region",
  "Sold prices by neighbourhood",
] as const;

/**
 * Bar widths, so the columns look typeset rather than generated. Six a
 * column, as the design draws them, in pixels of a 246px column at 1440 and
 * capped at the column so a narrow screen does not push them out.
 */
const WIDTHS = [
  [112, 86, 134, 98, 120, 78],
  [94, 128, 82, 110, 140, 90],
  [138, 104, 122, 84, 116, 96],
  [100, 132, 88, 118, 76, 126],
  [124, 92, 136, 80, 108, 98],
] as const;

export function SiteFooter({ note }: { note?: string }) {
  return (
    <footer className="border-t border-hairline-strong bg-background px-4 pt-11 pb-8 sm:px-6">
      <div className="mx-auto grid w-full max-w-[1328px] grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
        {COLUMNS.map((column, c) => (
          <div key={column} className="flex flex-col gap-3">
            <p className="text-sm/[22px] font-semibold text-ink">{column}</p>
            {/* Stacked on a phone, thirty grey bars read as a page that failed to load. The names carry it. */}
            <div aria-hidden className="hidden flex-col gap-[9px] sm:flex">
              {WIDTHS[c]!.map((width, i) => (
                <span
                  key={i}
                  className="h-[9px] max-w-full rounded-[5px] bg-hairline"
                  style={{ width }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-7 flex w-full max-w-[1328px] flex-wrap items-center justify-between gap-x-6 gap-y-1.5 border-t border-hairline pt-5">
        <p className="text-[13px]/5 text-ink-muted">
          Built by Walid Koleilat · A prototype. Every home, price and permit on
          it is invented.
        </p>
        <p className="text-[13px]/5 text-ink-muted">
          {note ?? "Nothing on this page has been sent to anyone."}
        </p>
      </div>
    </footer>
  );
}
