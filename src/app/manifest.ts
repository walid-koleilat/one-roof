import type { MetadataRoute } from "next";

/**
 * Installable-PWA manifest. This is what makes the prototype demoable as a
 * mobile app from the same codebase as the desktop web app: added to the iOS
 * or Android home screen it launches standalone, with no browser chrome.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "One Roof",
    // Under the icon on a home screen, where a long name is cut mid-word.
    short_name: "One Roof",
    description:
      "A house that holds two households, found without a login wall in front of anything that is already free.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#2F5FB3",
    categories: ["finance", "lifestyle"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
