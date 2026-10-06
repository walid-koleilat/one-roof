"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { SaveWall } from "@/components/account/save-wall";

/**
 * Who she is, what she has saved, and the one moment we ask her anything.
 *
 * The account lives here rather than on a page because the wall's whole design
 * argument is that it never takes her anywhere. Pressing Save on the arrival
 * page and pressing Save on the search page are the same event, the page stays
 * behind the panel, and when it closes she is exactly where she was with the
 * home now hers.
 *
 * Nothing in this prototype persists. Reloading signs her out again, which is
 * the honest behaviour for something with no server behind it.
 */

interface Account {
  name: string | null;
  signedIn: boolean;
  saved: readonly string[];
  /**
   * Whether the search itself is kept, as distinct from any home in it.
   *
   * Set when the "Keep this search" sheet completes, or when she presses the
   * bookmark while signed in. Signing out drops it along with everything else,
   * because nothing here survives a reload and pretending otherwise would be
   * the one dishonest thing in the provider.
   */
  searchKept: boolean;
  /**
   * The bookmark's press, once she is signed in. Signed out the page calls
   * askToKeepSearch instead, so that the first press asks and the second
   * toggles - the page decides which, because only the page knows both.
   */
  toggleSearchKept: () => void;
  /** True while the panel is up, so a page can dim behind it. */
  asking: boolean;
  /** Press Save on a home. The first press is the only one that asks. */
  save: (listingId: string) => void;
  /** Ask for the budget. The same wall, for the same reason, different words. */
  askForBudget: (address?: string) => void;
  /** She walked the budget steps, so the block below the results shows her number. */
  budgetWorked: boolean;
  /** The address she typed before the steps, if she typed one. */
  soldAddress: string | null;
  askToKeepSearch: () => void;
  /** Sign in or join from the nav, with nothing to keep yet. */
  askToSignIn: () => void;
  /**
   * Prototype only. The state switch needs to put the page into any of its
   * four states without walking the sign-up, and there is nowhere else in the
   * product that sets this directly.
   */
  setSignedIn: (next: boolean) => void;
  isSaved: (listingId: string) => boolean;
}

const AccountContext = createContext<Account>({
  name: null,
  signedIn: false,
  saved: [],
  searchKept: false,
  toggleSearchKept: () => {},
  asking: false,
  save: () => {},
  askForBudget: () => {},
  budgetWorked: false,
  soldAddress: null,
  askToKeepSearch: () => {},
  askToSignIn: () => {},
  setSignedIn: () => {},
  isSaved: () => false,
});

export function useAccount() {
  return useContext(AccountContext);
}

export function AccountProvider({
  children,
  /** Start signed in, for the screens that come after the wall. */
  startSignedIn = false,
  startSaved = [],
  startName = null,
}: {
  children: React.ReactNode;
  startSignedIn?: boolean;
  startSaved?: readonly string[];
  startName?: string | null;
}) {
  const [name, setName] = useState<string | null>(startName);
  const [signedIn, setSignedIn] = useState(startSignedIn);
  const [budgetWorked, setBudgetWorked] = useState(false);
  const [soldAddress, setSoldAddress] = useState<string | null>(null);
  const [saved, setSaved] = useState<readonly string[]>(startSaved);
  const [searchKept, setSearchKept] = useState(false);
  /**
   * What she was doing when the wall went up.
   *
   * There are two ways to reach it and they are not the same ask. Saving a
   * home is "keep this for me"; working out a budget is "work this out and
   * send it to me". The panel says whichever is true, because a wall that
   * describes the wrong act is a wall she reads as a trick.
   */
  const [pending, setPending] = useState<
    | { reason: "save"; listingId: string }
    | { reason: "budget" }
    | { reason: "search" }
    | { reason: "signin" }
    | null
  >(null);

  const save = useCallback(
    (listingId: string) => {
      if (signedIn) {
        setSaved((current) =>
          current.includes(listingId)
            ? current.filter((id) => id !== listingId)
            : [...current, listingId],
        );
        return;
      }
      // The first Save is the only thing on any page that asks a question.
      setPending({ reason: "save", listingId });
    },
    [signedIn],
  );

  const askForBudget = useCallback(
    (address?: string) => {
      const typed = address?.trim() ? address.trim() : null;
      setSoldAddress(typed);
      if (signedIn) {
        // Signed in, the steps are done already; the address is the only news.
        setBudgetWorked(true);
        return;
      }
      setPending({ reason: "budget" });
    },
    [signedIn],
  );

  /**
   * The nudge bar's one action. She has saved nothing yet; what is at risk is
   * the search itself, so the wall must say that rather than borrow the words
   * for a home.
   */
  const askToKeepSearch = useCallback(() => {
    if (signedIn) return;
    setPending({ reason: "search" });
  }, [signedIn]);

  /** The nav's Sign in and Join. Nothing is at stake yet, so the sheet says only that. */
  const askToSignIn = useCallback(() => {
    if (signedIn) return;
    setPending({ reason: "signin" });
  }, [signedIn]);

  const value = useMemo<Account>(
    () => ({
      name,
      signedIn,
      saved,
      searchKept,
      toggleSearchKept: () => setSearchKept((current) => !current),
      asking: pending !== null,
      save,
      askForBudget,
      budgetWorked,
      soldAddress,
      askToKeepSearch,
      askToSignIn,
      setSignedIn: (next: boolean) => {
        setSignedIn(next);
        setName(next ? (startName ?? "Nirosha") : null);
        if (!next) {
          setSaved([]);
          setSearchKept(false);
          setBudgetWorked(false);
          setSoldAddress(null);
        }
      },
      isSaved: (id: string) => saved.includes(id),
    }),
    [
      name,
      signedIn,
      saved,
      searchKept,
      pending,
      save,
      askForBudget,
      budgetWorked,
      soldAddress,
      askToKeepSearch,
      askToSignIn,
      startName,
    ],
  );

  return (
    <AccountContext.Provider value={value}>
      {children}
      {pending ? (
        <SaveWall
          reason={pending.reason}
          listingId={pending.reason === "save" ? pending.listingId : undefined}
          address={soldAddress}
          onAddress={(next) => setSoldAddress(next || null)}
          onCancel={() => setPending(null)}
          onDone={(chosenName) => {
            setName(chosenName);
            setSignedIn(true);
            if (pending.reason === "save") {
              const id = pending.listingId;
              setSaved((current) =>
                current.includes(id) ? current : [...current, id],
              );
            }
            if (pending.reason === "search") setSearchKept(true);
            if (pending.reason === "budget") setBudgetWorked(true);
            setPending(null);
          }}
        />
      ) : null}
    </AccountContext.Provider>
  );
}
