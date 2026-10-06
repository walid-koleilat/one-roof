import { PLACE_COLOUR, type PlaceKind } from "@/components/price-map";

/**
 * One glyph per layer, on the 16 x 16 grid the cards and the map badges use.
 *
 * The map already draws a cross, a bus, a temple and a basket; these are the
 * same four shapes cut loose from the map so the control that switches a
 * layer on can show what it switches on. Read from the same colour table as
 * the map, so a layer is one colour everywhere it appears.
 */
export function LayerGlyph({
  kind,
  size = 16,
  colour = PLACE_COLOUR[kind],
}: {
  kind: PlaceKind;
  size?: number;
  colour?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <Shape kind={kind} colour={colour} />
    </svg>
  );
}

function Shape({ kind, colour }: { kind: PlaceKind; colour: string }) {
  switch (kind) {
    case "health":
      return (
        <path
          d="M8 2.5V13.5M2.5 8H13.5"
          stroke={colour}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      );
    case "transit":
      return (
        <>
          <rect
            x="3"
            y="2.5"
            width="10"
            height="9.5"
            rx="2.2"
            stroke={colour}
            strokeWidth="1.6"
          />
          <path d="M3 7.5H13" stroke={colour} strokeWidth="1.4" />
          <circle cx="5.6" cy="10" r="1" fill={colour} />
          <circle cx="10.4" cy="10" r="1" fill={colour} />
          <path
            d="M4.5 12V14M11.5 12V14"
            stroke={colour}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </>
      );
    case "worship":
      return (
        <path
          d="M8 1.6L12.8 6.4H11.2V14H4.8V6.4H3.2L8 1.6Z"
          stroke={colour}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      );
    case "grocery":
      return (
        <>
          <path d="M2.6 5.2H13.4L12.2 13.4H3.8L2.6 5.2Z" fill={colour} />
          <path
            d="M5.6 5.2A2.4 2.4 0 0 1 10.4 5.2"
            stroke={colour}
            strokeWidth="1.5"
          />
        </>
      );
    case "parks":
      return (
        <>
          <circle cx="8" cy="6.6" r="4.4" fill={colour} />
          <rect x="7.2" y="9.6" width="1.6" height="4.6" rx="0.8" fill={colour} />
        </>
      );
  }
}
