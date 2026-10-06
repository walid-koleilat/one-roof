import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
    Next's dev badge is not part of the product, and on a phone it sat on
    top of the Filters sheet's one button, where it got reviewed as a bug.
    Off, so the dev server shows what the deployment shows.
  */
  devIndicators: false,
  /**
   * The screens were named before they were built, and the names changed.
   *
   * J1's two exits pointed at `/what-it-costs` while the arrival page was a
   * stub; the arrival page was then `/room-for-both`; and the design's FINAL
   * folded the arrival and the search into one page. Both old paths redirect
   * rather than breaking a link somebody may have already sent.
   */
  async redirects() {
    return [
      // The front door is gone. The root opens the guided route at its first
      // stop, so a bare link walks the conversation, the search and Saved in
      // order.
      { source: "/", destination: "/my-parents-are-moving-in?tour=1", permanent: false },
      { source: "/what-it-costs", destination: "/homes-with-a-suite", permanent: false },
      { source: "/room-for-both", destination: "/homes-with-a-suite", permanent: false },
      { source: "/j1", destination: "/my-parents-are-moving-in", permanent: false },
      // The chat page was named for the outcome she wants. It is now named for
      // the thing that is actually happening to her, which is what she typed.
      {
        source: "/room-for-my-parents",
        destination: "/my-parents-are-moving-in",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
