import type { Metadata } from "next";

/**
 * The tab name for the chat screen.
 *
 * The page itself is a client component and cannot export metadata, so the
 * title lives here. It is the sentence she actually typed rather than a
 * description of the screen, which is also what the URL says.
 */
export const metadata: Metadata = {
  title: "My parents are moving in",
  description:
    "Nirosha describes the problem to an assistant, and two One Roof cards arrive under different rules.",
};

export default function ConversationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
