import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AgentsSection } from "./agents-section";
import { AGENTS } from "@/data/agents";

afterEach(cleanup);

/**
 * A card opens the record behind it, and nothing on the record reaches an
 * agent: no phone, no form, no message. The sheet says so in its last line.
 */
describe("the agents' records", () => {
  it("opens in place from the card, says nobody is told, and closes on Escape", () => {
    render(<AgentsSection declared={{ language: "Tamil" }} />);
    const anusha = AGENTS.find((a) => a.id === "anusha")!;
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: anusha.name }));
    const sheet = screen.getByRole("dialog", { name: `${anusha.name}, the record` });
    expect(sheet).toHaveTextContent(anusha.record.brokerage);
    expect(sheet).toHaveTextContent("Nobody is told you looked");
    for (const close of anusha.record.recent) expect(sheet).toHaveTextContent(close.street);
    expect(sheet.querySelector('a[href^="tel:"], a[href^="mailto:"], form, input')).toBeNull();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows three, and which three depends only on what she declared", () => {
    render(<AgentsSection declared={{ language: "Tamil" }} />);
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Thivya Selvam" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Wendy Chau" })).toBeNull();
    expect(screen.getByText("Tamil first, because you asked for that.")).toBeInTheDocument();
    cleanup();

    render(<AgentsSection declared={null} />);
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Wendy Chau" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Thivya Selvam" })).toBeNull();
    expect(screen.queryByText(/because you asked for that/)).toBeNull();
  });

  it("warns, in the record, about the one who mostly acts for sellers", () => {
    render(<AgentsSection declared={null} />);
    const kayal = AGENTS.find((a) => a.id === "kayal")!;
    fireEvent.click(screen.getByRole("button", { name: kayal.name }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Mostly acts for sellers");
    fireEvent.click(screen.getByRole("button", { name: "Close the record" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
