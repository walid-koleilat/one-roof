"use client";

import { useEffect } from "react";

/** The width the frame narrows to. An iPhone's, in CSS pixels. */
export const PHONE_WIDTH = 390;
/** And its height, when the window has room for it. */
const PHONE_HEIGHT = 844;

/**
 * The same page, in a phone's width, for a reviewer sitting at a laptop.
 *
 * It is a frame around a second copy of the page rather than a narrowed
 * container, because the page lays itself out from the viewport: a 390px
 * column inside a 1300px window would still be the laptop layout, squeezed.
 * The copy has its own viewport, so what it draws is what a phone draws, and
 * the two switches beside it reach it through the address. It is not a device
 * emulator and does not pretend to be one: the type, the touch targets and
 * the breakpoints are the page's own.
 */
export function PhoneFrame({ src }: { src: string }) {
  useEffect(() => {
    // The page behind the frame has nothing to say while the frame is up.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#EDEDEA] px-4 pt-4 pb-24">
      <div
        style={{ width: PHONE_WIDTH, height: `min(${PHONE_HEIGHT}px, 100%)` }}
        className="max-w-full overflow-hidden rounded-[44px] border-[10px] border-ink bg-ink shadow-[0_24px_60px_rgba(22,24,26,0.35)]"
      >
        <iframe
          src={src}
          title="The same page, at a phone's width"
          className="h-full w-full rounded-[34px] bg-background"
        />
      </div>
    </div>
  );
}
