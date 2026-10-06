"use client";

import { useAccount } from "@/components/account/account-provider";
import { cn } from "@/lib/utils";

/**
 * The one control on any page that asks for anything.
 *
 * Top right of the photograph, because that is where a person looks for it and
 * because the top left is where a verdict goes. Where it has a word it says
 * "Save" and then "Saved" - never "Keep", which nobody could explain, and
 * never "Add to board", which is a word this product had to give back to
 * TRREB.
 *
 * It stops the click reaching the card, so saving a home is never the same
 * gesture as selecting one.
 */
/**
 * Two looks, each named for the surface that needs it, and `bare` for the
 * results card.
 *
 * `pill` is the default and the one the word "Save" belongs on: a page where
 * she has not saved this house yet, and the button has to say what it does.
 *
 * `mark` drops the word. On Saved every home is already saved, so the label
 * would say "Saved" on all eleven tiles - a word repeated eleven times that
 * distinguishes nothing. What is left is the filled heart, which is the same
 * mark she pressed to put the house here, and pressing it takes it out.
 *
 * `bare` is the results card's heart, alone in a white disc that inverts when
 * saved. It and `mark` are the same idea drawn twice, because the search page
 * and Saved were designed apart; folding them into one look is owed.
 */
export type SaveButtonLook = "pill" | "mark";

export function SaveButton({
  listingId,
  /**
   * The heart alone, in a white disc on the photograph.
   *
   * The results card is 196px of photograph beside a checklist, and the
   * checklist is the thing on it doing work. The heart is the one mark
   * everybody reads as "keep this" without a word, so on the card it is
   * the whole button; the word is there for a screen reader. Saved, the
   * disc goes to ink and the heart fills.
   */
  bare,
  look = "pill",
}: {
  listingId: string;
  bare?: boolean;
  look?: SaveButtonLook;
}) {
  const { save, isSaved } = useAccount();
  const saved = isSaved(listingId);
  const mark = look === "mark";

  if (bare) {
    return (
      <button
        type="button"
        aria-pressed={saved}
        onClick={(event) => {
          event.stopPropagation();
          save(listingId);
        }}
        className={cn(
          "z-20 flex size-8 shrink-0 items-center justify-center rounded-full shadow-[0_1px_3px_rgba(22,24,26,0.25)] transition-colors",
          saved ? "bg-ink text-white" : "bg-background text-ink hover:bg-sunken",
        )}
      >
        <Heart filled={saved} size={15} />
        <span className="sr-only">{saved ? "Saved. Remove it" : "Save"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={mark ? (saved ? "Saved. Take it out." : "Save") : undefined}
      onClick={(event) => {
        event.stopPropagation();
        save(listingId);
      }}
      className={cn(
        "z-20 flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px]/[19px] font-medium shadow-[0_1px_3px_rgba(22,24,26,0.22)] transition-colors sm:min-h-0",
        mark && "size-[30px] min-h-0 justify-center gap-0 p-0 sm:size-[26px]",
        saved && !mark ? "bg-ink text-white" : "bg-background text-ink",
        mark && "bg-background/92",
      )}
    >
      <Heart filled={saved} size={mark ? 12 : 13} />
      {mark ? null : saved ? "Saved" : "Save"}
    </button>
  );
}

function Heart({ filled, size = 13 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <path
        d="M8 13.6 C8 13.6 1.9 10.1 1.9 6.1 C1.9 4.2 3.4 2.8 5.2 2.8 C6.4 2.8 7.5 3.5 8 4.5 C8.5 3.5 9.6 2.8 10.8 2.8 C12.6 2.8 14.1 4.2 14.1 6.1 C14.1 10.1 8 13.6 8 13.6 Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
