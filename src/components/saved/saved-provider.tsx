"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
} from "react";
import { CEILING_INPUTS } from "@/data/budget";
import { SAVED_COLLECTIONS, SAVED_SEARCHES } from "@/data/saved";
import { ceilingFrom, type Ceiling } from "@/lib/domain/budget";
import { savedReducer } from "@/lib/domain/saved-reducer";
import {
  initSession,
  type SavedAction,
  type SavedSession,
} from "@/lib/domain/saved-session";
import { WORLD, type SavedWorld } from "@/lib/domain/saved-view";

/**
 * Everything the saved page knows, in one place, with no React below it.
 *
 * The page used to hold eight `useState`s and hand them down. Three of them
 * were lists of listing ids with no memory of which search they belonged to,
 * and removing a home from one search removed it from another. The state now
 * lives in `savedReducer` under `src/lib/domain/`, where the regression is a
 * three-line test, and this provider is the only place React touches it.
 *
 * It also holds the ceiling. The bracket, what she owes, what she has put by
 * and the payment she named are declared inputs in `src/data/budget.ts`, so
 * the ceiling exists from the first render and every tile can say where it
 * sits. Nothing here computes a midpoint; `ceilingFrom` returns two ends and
 * the band, and that is all any component gets.
 *
 * Nothing persists. Reloading forgets it, which is the honest behaviour for
 * something with no server behind it.
 */

interface SavedContextValue {
  state: SavedSession;
  dispatch: Dispatch<SavedAction>;
  world: SavedWorld;
  ceiling: Ceiling;
}

const SavedContext = createContext<SavedContextValue | null>(null);

export function useSaved(): SavedContextValue {
  const value = useContext(SavedContext);
  if (!value) {
    throw new Error("useSaved must be used inside <SavedProvider>.");
  }
  return value;
}

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    savedReducer,
    {
      collections: SAVED_COLLECTIONS,
      firstSearchId: SAVED_SEARCHES[0]!.id,
    },
    initSession,
  );

  const ceiling = useMemo(() => ceilingFrom(CEILING_INPUTS), []);

  const value = useMemo<SavedContextValue>(
    () => ({ state, dispatch, world: WORLD, ceiling }),
    [state, ceiling],
  );

  return (
    <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
  );
}
