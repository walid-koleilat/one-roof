import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Figtree, IBM_Plex_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TourRail } from "@/components/tour/tour-rail";

/**
 * Figtree for everything the product says. Three weights, because
 * the design system distinguishes hierarchy by size and colour rather than by
 * weight. The fourth, 700, exists for one thing: the hero headline, which the
 * design sets bold and which a browser would otherwise fake by smearing 600.
 */
const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

/**
 * The mono is for labels that are about the interface rather than the house:
 * field captions, the prototype strip, WHAT MATTERS TO YOU. The design draws
 * them in IBM Plex Mono and the build was falling back to whatever the
 * machine had, which on a Mac is Menlo and reads a size larger.
 */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-mono",
});

/**
 * "Buying a multigenerational home" - the plainest statement of what this is.
 *
 * It was "Out of a condo" from the project's first framing, then "Room for
 * both", which was a phrase rather than a description. A visitor reads the
 * browser tab before they read anything else, and it should tell them what
 * they are about to look at rather than make them work it out.
 *
 * "Journey" was considered and dropped. It is the word every deck uses and it
 * adds nothing to the sentence.
 */
export const metadata: Metadata = {
  metadataBase: new URL("https://one-roof-home.vercel.app"),
  title: {
    default: "Buying a multigenerational home",
    template: "%s · Buying a multigenerational home",
  },
  description:
    "A house that holds two households, found without a login wall in front of anything that is already free.",
  applicationName: "One Roof",
  // What a link to any page unfurls as, in a chat or a feed: one sentence
  // about the family, and the search page as drawn.
  openGraph: {
    type: "website",
    siteName: "One Roof",
    title: "Buying a multigenerational home",
    description:
      "One family buying one house for themselves and their ageing parents. A product concept by Walid Koleilat.",
    images: [{ url: "/screens/the-search.png", width: 1000, height: 586, alt: "The search page, with her conversation carried into the search bar." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buying a multigenerational home",
    description:
      "One family buying one house for themselves and their ageing parents. A product concept by Walid Koleilat.",
    images: ["/screens/the-search.png"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "One Roof",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  // Kept out of search. Every home and price here is invented, and a search
  // result would present them as real listings.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-CA"
      className={cn("font-sans", figtree.variable, plexMono.variable)}
    >
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <TooltipProvider delayDuration={200}>
          {children}
          {/* Renders nothing unless ?tour=1 is on the URL. */}
          <TourRail />
        </TooltipProvider>
      </body>
    </html>
  );
}
