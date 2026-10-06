import type { PinShape } from "@/components/price-map";
import { AD_LISTINGS } from "@/data/listings";

/**
 * Eleven homes, which is the number the headline claims.
 *
 * They were five here until somebody counted. An advert that says eleven and
 * draws five is not making a smaller promise, it is making a false one, and
 * the map is the only place on this card where the claim can be checked. The
 * mix is four with a suite, four already on the ground floor, three that could
 * be converted, and the dot colours make that countable without a caption.
 *
 * Three of them carry an `id`, because three of them have a card underneath.
 * The other eight are homes she would have to open One Roof to see, which is
 * what the link in the footer is for.
 */
/**
 * The drawing the pins are placed on.
 *
 * Held here rather than typed into the component, because the bounds test used
 * to carry its own copy of 730 x 380 and would have gone on passing after the
 * map was resized.
 */
export const AD_MAP_VIEWBOX = { width: 730, height: 380 } as const;

export const AD_PINS: readonly {
  id?: string;
  x: number;
  y: number;
  price: string;
  shape: PinShape;
}[] = [
  // The four with a second kitchen. The cheapest of them is the one with no
  // record at the city, which is why the assistant names it in prose and the
  // widget does not draw it a card.
  { id: AD_LISTINGS[0]!.id, x: 118, y: 96, price: "$1.19m", shape: "suite" },
  { x: 150, y: 178, price: "$1.16m", shape: "suite" },
  { x: 398, y: 170, price: "$1.27m", shape: "suite" },
  { x: 330, y: 244, price: "$1.36m", shape: "suite" },
  // Four already have the bedroom and bathroom on the ground floor.
  { id: AD_LISTINGS[1]!.id, x: 272, y: 152, price: "$1.28m", shape: "ground" },
  { x: 240, y: 62, price: "$1.09m", shape: "ground" },
  { x: 486, y: 106, price: "$1.24m", shape: "ground" },
  { x: 452, y: 288, price: "$1.31m", shape: "ground" },
  // Three could take a suite later, if the basement is tall enough.
  { id: AD_LISTINGS[2]!.id, x: 512, y: 200, price: "$1.34m", shape: "convert" },
  { x: 196, y: 252, price: "$1.22m", shape: "convert" },
  { x: 368, y: 72, price: "$1.42m", shape: "convert" },
];
