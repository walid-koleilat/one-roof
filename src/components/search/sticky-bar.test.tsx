import type { ComponentProps } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BASE_MINUTES, DEFAULT_SEARCH } from "@/data/counts";
import { StickyBar } from "./sticky-bar";

afterEach(cleanup);

function mount(props: Partial<ComponentProps<typeof StickyBar>> = {}) {
  const onOpenSearch = vi.fn();
  render(
    <StickyBar
      state={DEFAULT_SEARCH}
      summary={null}
      total={245}
      view="both"
      onToggleShape={() => {}}
      onView={() => {}}
      onOpenSearch={onOpenSearch}
      filterCount={0}
      onOpenFilters={() => {}}
      needs={{ nearHospital: true, nearTransit: true, nearTemple: false, nearGrocery: false }}
      onToggleNeed={() => {}}
      minutes={BASE_MINUTES}
      onMinutes={() => {}}
      {...props}
    />,
  );
  return { onOpenSearch };
}

describe("the left slot", () => {
  it("is empty when there was no chat: Filters and the view toggle, nothing else", () => {
    mount();
    expect(screen.queryByText(/From your ChatGPT conversation/)).toBeNull();
    // Nothing came from a chat, so nothing stands in for one. The four
    // places and the three shapes are reached through Filters like every
    // other typical control.
    expect(screen.queryByRole("button", { name: /^Scarborough/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Places/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Own kitchen/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^No stairs/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Suite/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Ground floor/ })).toBeNull();
    const names = screen.getAllByRole("button").map((b) => b.textContent?.trim());
    expect(names).toEqual(["Filters", "List", "Both", "Map"]);
  });

  it("is the eyebrow over her three chips when there was, and the eyebrow opens the search", () => {
    const { onOpenSearch } = mount({ summary: "no stairs · her own kitchen" });
    const eyebrow = screen.getByRole("button", { name: /From your ChatGPT conversation/ });
    for (const label of ["Own kitchen", "No stairs"]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${label}`) })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    }
    expect(screen.getByRole("button", { name: /^Places/ })).toHaveTextContent("Places2");
    expect(screen.queryByRole("button", { name: /^Ground floor/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Scarborough/ })).toBeNull();
    fireEvent.click(eyebrow);
    expect(onOpenSearch).toHaveBeenCalledTimes(1);
  });

  it("expands Places into the four places with their distances, and switches one", () => {
    const onToggleNeed = vi.fn();
    mount({ summary: "no stairs · her own kitchen", onToggleNeed });
    expect(screen.queryByRole("switch")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Places/ }));
    expect(screen.getByRole("switch", { name: "Hospital within 15 min" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    const temple = screen.getByRole("switch", { name: "A temple within 10 min" });
    expect(temple).toHaveAttribute("aria-checked", "false");
    fireEvent.click(temple);
    expect(onToggleNeed).toHaveBeenCalledWith("nearTemple");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("switch")).toBeNull();
  });

  it("lets her draw a place closer or further, one declared stop at a time", () => {
    const onMinutes = vi.fn();
    mount({ summary: "no stairs · her own kitchen", onMinutes });
    fireEvent.click(screen.getByRole("button", { name: /^Places/ }));
    fireEvent.click(screen.getByRole("button", { name: "Hospital: more minutes" }));
    expect(onMinutes).toHaveBeenCalledWith("nearHospital", 20);
    fireEvent.click(screen.getByRole("button", { name: "A bus: fewer minutes" }));
    expect(onMinutes).toHaveBeenCalledWith("nearTransit", 5);
    // A place that is off cannot be drawn closer; the stepper waits for the switch.
    expect(screen.getByRole("button", { name: "A temple: more minutes" })).toBeDisabled();
  });
});

describe("the view toggle", () => {
  it("hides Both below 64rem, where the columns stack", () => {
    mount();
    const both = screen.getByRole("button", { name: "Both" });
    expect(both.className).toContain("hidden");
    expect(both.className).toContain("lg:flex");
    for (const label of ["List", "Map"]) {
      expect(screen.getByRole("button", { name: label }).className).not.toContain(
        "hidden",
      );
    }
  });
});
