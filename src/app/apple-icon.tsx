import { ImageResponse } from "next/og";

/**
 * iOS ignores manifest icons when a page is added to the home screen and looks
 * for an apple-touch-icon instead, which must be a raster image. Generating it
 * here keeps the mark in one place (no exported PNG to drift) and means the
 * installed mobile app looks deliberate rather than like a screenshot of a tab.
 * The mark is the nav's: one roof over three generations, white on the blue.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2F5FB3",
        }}
      >
        <svg width="116" height="116" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 11.5 12 4l9 7.5"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="7.5" cy="17" r="2" fill="#FFFFFF" />
          <circle cx="12" cy="17" r="2" fill="#FFFFFF" />
          <circle cx="16.5" cy="17" r="2" fill="#FFFFFF" />
        </svg>
      </div>
    ),
    size,
  );
}
