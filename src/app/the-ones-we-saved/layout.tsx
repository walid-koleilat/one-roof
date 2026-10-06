import type { Metadata } from "next";

/**
 * The tab name for the saved homes.
 *
 * The page is a client component and cannot export metadata, so the title
 * lives here. It is the page's own heading, which is also what the URL says.
 */
export const metadata: Metadata = {
  title: "The ones we saved",
  description:
    "Every home the family kept, with the notes and replies from all of them sitting on the house they are about, so nobody is guessing when it is time to make an offer.",
};

export default function SavedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
