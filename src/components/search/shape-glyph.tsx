import { SHAPE_COLOUR, type PinShape } from "@/components/price-map";

/**
 * The three shapes a home can take, as one house with one module coloured.
 *
 * The house is white with an ink outline, and the only thing that changes is
 * which block takes the shape's colour: the lower floor for a suite that is
 * already there, the main floor for a bedroom and bath on the ground floor,
 * and for a basement that could become a suite the lower block is drawn in
 * the colour but dashed, because it is a possibility rather than a room. The
 * colour is the one the pin's dot carries, so a chip, the map's legend and a
 * pin all say the same thing the same way.
 */
export function ShapeGlyph({
  shape,
  size = 16,
  colour = SHAPE_COLOUR[shape],
  ink = "currentColor",
}: {
  shape: PinShape;
  size?: number;
  colour?: string;
  /** The outline. Defaults to the text colour it sits beside. */
  ink?: string;
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
      {/* The house, white, with a floor line between its two blocks. */}
      <path
        d="M2.5 7.2L8 2.4L13.5 7.2V13.6H2.5V7.2Z"
        fill="#FFFFFF"
        stroke={ink}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {shape === "suite" ? (
        <rect x="3.15" y="10" width="9.7" height="2.95" fill={colour} />
      ) : shape === "ground" ? (
        <rect x="3.15" y="7.3" width="9.7" height="2.7" fill={colour} />
      ) : (
        <rect
          x="3.65"
          y="10.5"
          width="8.7"
          height="2"
          stroke={colour}
          strokeWidth="1.1"
          strokeDasharray="1.5 1.2"
        />
      )}
      <path d="M2.5 10H13.5" stroke={ink} strokeWidth="1" opacity="0.45" />
    </svg>
  );
}
