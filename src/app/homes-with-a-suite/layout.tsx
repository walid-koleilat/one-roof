import type { Metadata } from "next";

/**
 * Rendered per request, not at build.
 *
 * The page reads its starting state from the address (`?context=off`,
 * `?account=in`, `?frame=phone`), so the server has to see the address to
 * draw the right page first time. Static, it would draw the default and
 * correct itself after hydration, which is a flash inside the phone frame
 * every time a switch is pressed.
 */
export const dynamic = "force-dynamic";

/**
 * The tab name for the search.
 *
 * The page is a client component and cannot export metadata, so the title
 * lives here. It says what the page holds rather than what the product is
 * called, which is also what the URL says.
 */
export const metadata: Metadata = {
  title: "Homes with a suite in Bendale",
  description:
    "The search her conversation set up: homes with a suite, a bedroom on the ground floor, or a basement that could become one, each measured against what she said, with the map, the ceiling her house leaves, and three agents who have bought one.",
};

export default function SearchLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
