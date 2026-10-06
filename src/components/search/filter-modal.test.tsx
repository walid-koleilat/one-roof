import type { ComponentProps } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FilterModal, type Need } from "./filter-modal";
import { BASE_MINUTES, DEFAULT_SEARCH, type Ceiling, type SearchState } from "@/data/counts";

afterEach(cleanup);

function mount(
  state: SearchState = DEFAULT_SEARCH,
  count: number | null = 31,
  overrides: Partial<ComponentProps<typeof FilterModal>> = {},
) {
  const onToggleShape = vi.fn();
  const onToggleNeed = vi.fn<(need: Need) => void>();
  const onCeiling = vi.fn<(ceiling: Ceiling | null) => void>();
  const onFloor = vi.fn<(floor: Ceiling | null) => void>();
  const onClearAll = vi.fn();
  const onClose = vi.fn();
  const onOpenValuation = vi.fn();
  const onMinutes = vi.fn();
  const onRooms = vi.fn();
  render(
    <FilterModal
      state={state}
      minutes={BASE_MINUTES}
      onMinutes={onMinutes}
      rooms={{ beds: 1, baths: 1 }}
      onRooms={onRooms}
      chatRooms={null}
      afford={null}
      count={count}
      settled={count !== null}
      onToggleShape={onToggleShape}
      onToggleNeed={onToggleNeed}
      onCeiling={onCeiling}
      onFloor={onFloor}
      onClearAll={onClearAll}
      onClose={onClose}
      onOpenValuation={onOpenValuation}
      {...overrides}
    />,
  );
  return { onToggleShape, onToggleNeed, onCeiling, onFloor, onClearAll, onClose, onOpenValuation, onMinutes, onRooms };
}

/** Nothing on, nothing set: what the page leaves after Clear all. */
const CLEARED: SearchState = {
  ...DEFAULT_SEARCH,
  underBudget: false,
  nearHospital: false,
  nearTransit: false,
  nearTemple: false,
  nearGrocery: false,
};

describe("FilterModal, how everyone fits", () => {
  it("draws the three shapes in the board's words, with the first two on", () => {
    const { onToggleShape } = mount();
    const suite = screen.getByRole("button", { name: /A suite that is already there/ });
    expect(suite).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /A bedroom and bath on the ground floor/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /A basement that could become one/ }),
    ).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(suite);
    expect(onToggleShape).toHaveBeenCalledWith("suite");
  });

  it("derives the total the first two add up to", () => {
    mount();
    expect(
      screen.getByText(/^The first two add up to the thirty-one that match\./),
    ).toBeInTheDocument();
  });
});

describe("FilterModal, price", () => {
  it("is a slider over the declared ceilings and none, resting on hers", () => {
    const { onCeiling } = mount();
    const slider = screen.getByRole("slider", { name: "Maximum price" });
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "4");
    expect(slider).toHaveAttribute("aria-valuenow", "2");
    expect(slider).toHaveAttribute("aria-valuetext", "Under $1,250,000, 31 homes");

    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(onCeiling).toHaveBeenLastCalledWith(1_150_000);
    fireEvent.keyDown(slider, { key: "End" });
    expect(onCeiling).toHaveBeenLastCalledWith(null);
    fireEvent.keyDown(slider, { key: "Home" });
    expect(onCeiling).toHaveBeenLastCalledWith(1_050_000);
  });

  it("reads the figure in the Maximum pill, and the count on the button", () => {
    mount();
    expect(screen.getByText("$1,250,000")).toBeInTheDocument();
    expect(screen.getByText("Maximum")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show 31 homes" })).toBeInTheDocument();
  });

  it("rests on No ceiling once the budget is off", () => {
    const { onCeiling } = mount({ ...DEFAULT_SEARCH, underBudget: false });
    const slider = screen.getByRole("slider", { name: "Maximum price" });
    expect(slider).toHaveAttribute("aria-valuenow", "4");
    expect(slider).toHaveAttribute("aria-valuetext", "No ceiling, 54 homes");
    expect(screen.getByText("$1,350,000+")).toBeInTheDocument();
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onCeiling).not.toHaveBeenCalled();
  });

  it("draws no minimum, and offers the valuation as the way to a ceiling", () => {
    const { onOpenValuation } = mount();
    expect(screen.queryByRole("textbox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Find out what your current house is worth" }));
    expect(onOpenValuation).toHaveBeenCalledTimes(1);
  });
});

describe("FilterModal, travel time", () => {
  it("shows four switches that share state with the rows above", () => {
    const { onToggleNeed } = mount();
    const temple = screen.getByRole("switch", { name: "A temple within 10 min" });
    expect(temple).toHaveAttribute("aria-checked", "false");
    expect(
      screen.getByRole("switch", { name: "Hospital within 15 min" }),
    ).toHaveAttribute("aria-checked", "true");
    fireEvent.click(temple);
    expect(onToggleNeed).toHaveBeenCalledWith("nearTemple");
  });

  it("steps a distance through the declared stops, and holds it while the place is off", () => {
    const { onMinutes } = mount();
    fireEvent.click(screen.getByRole("button", { name: "Hospital: fewer minutes" }));
    expect(onMinutes).toHaveBeenCalledWith("nearHospital", 10);
    expect(screen.getByRole("button", { name: "A grocery: more minutes" })).toBeDisabled();
  });

  it("does not deliver bad news while there are enough homes", () => {
    mount();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("names the costliest requirement and offers to drop it when too few remain", () => {
    const state = { ...DEFAULT_SEARCH, nearTemple: true, nearGrocery: true };
    const { onToggleNeed } = mount(state, 0);
    expect(screen.getByRole("status")).toHaveTextContent(
      "A temple within 10 min took you from nineteen homes to none. Drop it and nineteen come back.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Drop the temple" }));
    expect(onToggleNeed).toHaveBeenCalledWith("nearTemple");
  });
});

describe("FilterModal, what she can afford", () => {
  it("puts what the house supports in a third field, with Use it setting the maximum there", () => {
    const { onCeiling } = mount(DEFAULT_SEARCH, 31, {
      afford: { address: "27 Marcos Boulevard", semi: 964_000, ceiling: 1_350_000 },
    });
    expect(screen.queryByRole("button", { name: /Find out what your current house/ })).toBeNull();
    expect(screen.getByText("From your house at 27 Marcos Boulevard")).toBeInTheDocument();
    expect(screen.getByText("Up to $1,350,000")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Use it" }));
    expect(onCeiling).toHaveBeenCalledWith(1_350_000);
  });

  it("shows a tick instead of the button once the maximum is there", () => {
    mount(DEFAULT_SEARCH, 31, {
      afford: { address: "27 Marcos Boulevard", semi: 964_000, ceiling: 1_250_000 },
    });
    expect(screen.queryByRole("button", { name: "Use it" })).toBeNull();
    expect(screen.getByLabelText("Your maximum is set there")).toBeInTheDocument();
  });
});

describe("FilterModal, the minimum", () => {
  it("rides the same track, starts at none, and cannot pass the maximum", () => {
    const { onFloor } = mount();
    const min = screen.getByRole("slider", { name: "Minimum price" });
    expect(min).toHaveAttribute("aria-valuenow", "0");
    expect(min).toHaveAttribute("aria-valuetext", "No minimum");
    expect(screen.getByText("No minimum")).toBeInTheDocument();
    fireEvent.keyDown(min, { key: "ArrowRight" });
    expect(onFloor).toHaveBeenLastCalledWith(1_050_000);
    // The maximum sits at the third stop, so the minimum can go no higher than the second.
    fireEvent.keyDown(min, { key: "End" });
    expect(onFloor).toHaveBeenLastCalledWith(1_150_000);
  });

  it("reads the range in the fields once both are set", () => {
    mount({ ...DEFAULT_SEARCH, floor: 1_050_000 });
    expect(screen.getByText("$1,050,000")).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Minimum price" })).toHaveAttribute(
      "aria-valuetext",
      "From $1,050,000",
    );
  });
});

describe("FilterModal, rooms", () => {
  it("names the conversation beside the rooms it set, and only while they stand", () => {
    mount(DEFAULT_SEARCH, 31, { rooms: { beds: 4, baths: 2 }, chatRooms: { beds: 4, baths: 2 } });
    expect(screen.getAllByText("From your ChatGPT conversation")).toHaveLength(2);
    cleanup();
    mount(DEFAULT_SEARCH, 31, { rooms: { beds: 5, baths: 2 }, chatRooms: { beds: 4, baths: 2 } });
    expect(screen.getAllByText("From your ChatGPT conversation")).toHaveLength(1);
  });

  it("steps bedrooms and bathrooms up from Any, and not below it", () => {
    const { onRooms } = mount();
    expect(screen.getAllByText("Any")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Bedrooms: fewer" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Bedrooms: more" }));
    expect(onRooms).toHaveBeenCalledWith({ beds: 2, baths: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Bathrooms: more" }));
    expect(onRooms).toHaveBeenCalledWith({ beds: 1, baths: 2 });
  });
});

describe("FilterModal, the shell", () => {
  it("orders the sections the way the owner asked", () => {
    mount();
    expect(
      screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent),
    ).toEqual([
      "How everyone fits",
      "Price",
      "Rooms",
      "Travel time",
      "Not in this prototype",
    ]);
  });

  it("names every filter it does not have", () => {
    mount();
    const gap = screen.getByText(/^Property type/);
    for (const name of [
      "Property type",
      "parking",
      "a separate side entrance",
      "listed in the last 14 days",
      "open house this weekend",
    ]) {
      expect(gap).toHaveTextContent(name);
    }
  });

  it("clears through the callback, and greys Clear all when there is nothing to clear", () => {
    const { onClearAll } = mount();
    const clear = screen.getByRole("button", { name: "Clear all" });
    expect(clear).toBeEnabled();
    fireEvent.click(clear);
    expect(onClearAll).toHaveBeenCalledTimes(1);

    cleanup();
    mount(CLEARED, 0);
    expect(screen.getByRole("button", { name: "Clear all" })).toBeDisabled();
  });

  it("greys the button and withholds the number while counting", () => {
    mount(DEFAULT_SEARCH, null);
    expect(screen.getByRole("button", { name: "Counting" })).toBeDisabled();
    expect(screen.queryByText(/^Show \d+ homes$/)).toBeNull();
  });

  it("closes on the button once the count has settled", () => {
    const { onClose } = mount();
    const show = screen.getByRole("button", { name: "Show 31 homes" });
    expect(show).toBeEnabled();
    fireEvent.click(show);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
