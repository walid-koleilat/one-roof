import { cn } from "@/lib/utils";

/**
 * One roof over three dots, for three generations under it.
 *
 * Drawn in currentColor, so it takes the action blue on a light ground and
 * white on a filled square. The favicon and the app icon draw the same paths,
 * so the mark on a home screen is the mark in the nav.
 */
export function RoofMark({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path
        d="M3 11.5 12 4l9 7.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="17" r="2" fill="currentColor" />
      <circle cx="12" cy="17" r="2" fill="currentColor" />
      <circle cx="16.5" cy="17" r="2" fill="currentColor" />
    </svg>
  );
}

/**
 * The name set in the product face beside the mark.
 *
 * Sized from a width rather than a font size, because every caller was written
 * against an image wordmark and passes the width it had room for.
 */
export function Wordmark({
  className,
  width = 108,
}: {
  className?: string;
  width?: number;
}) {
  const fontSize = Math.round(width / 6.2);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-[0.3em] font-semibold tracking-[-0.02em] text-action",
        className,
      )}
      style={{ fontSize, lineHeight: 1 }}
    >
      <RoofMark size={Math.round(fontSize * 1.15)} />
      One Roof
    </span>
  );
}
