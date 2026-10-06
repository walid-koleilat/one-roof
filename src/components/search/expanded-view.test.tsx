import type { ComponentProps } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LISTINGS } from "@/data/listings";
import { ExpandedView } from "./expanded-view";

afterEach(cleanup);

function mount(props: Partial<ComponentProps<typeof ExpandedView>> = {}) {
  const onSignIn = vi.fn();
  render(
    <ExpandedView
      bar={<div data-testid="bar" />}
      map={null}
      controls={null}
      listings={LISTINGS.slice(0, 2)}
      selected={null}
      count={31}
      onSelect={() => {}}
      onCollapse={() => {}}
      signedIn={false}
      savedCount={0}
      onSignIn={onSignIn}
      {...props}
    />,
  );
  return { onSignIn };
}

/**
 * The nav is gone in this view. The bar absorbs the two things it carried,
 * and nothing else, so these check for exactly those two.
 */
describe("ExpandedView chrome", () => {
  it("carries the mark and the way in, with the bar between them", () => {
    const { onSignIn } = mount();
    expect(screen.getByRole("img", { name: "One Roof" })).toBeInTheDocument();
    expect(screen.getByTestId("bar")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("reads how many are hers once she is signed in, the way the nav does", () => {
    mount({ signedIn: true, savedCount: 3 });
    expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
    expect(screen.getByText("3 saved")).toBeInTheDocument();
  });
});
