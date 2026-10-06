# One Roof

Buying one house for three generations. A product concept by Walid Koleilat.

**Live:** https://one-roof-home.vercel.app

## The problem

More than 440,000 Canadian households hold three generations under one roof. They work out what home they need in ChatGPT and the family group chat. Then they start over. The listing site can't filter for "no stairs," and the agent gets a one-line enquiry with no context.

## The solution

One Roof carries the family's own words through the move. It answers inside ChatGPT with homes that fit, and the search opens already filled in. The family builds one shortlist together. The agent inherits the decision and the deadline, never the budget ceiling.

## The expected impact

Listing sites turn a tiny share of their visits into sales. A lead that arrives with the family's context is worth an agent's hour. The goal is to double sales from traffic the site already has, measured on what the median agent closes so the gain has to show up for ordinary agents.

## Build notes

It's a working three-page prototype in Next.js, React and Tailwind that installs as a phone app. The assistant is scripted, so no hosted model ever touches listing data. 468 tests guard what a family or an agent can see. I built it with Claude Code.

Frontend only. Mock data throughout, and the site says so.

## The journey, in three steps

The root opens a guided route through three pages, with a Next button along the bottom. Each page
also works as a link on its own.

| Step | The claim | Page |
|---|---|---|
| **Where it starts** | She starts in ChatGPT, not on a portal | [/my-parents-are-moving-in](https://one-roof-home.vercel.app/my-parents-are-moving-in) |
| **The search** | She moves to One Roof, and nothing starts over | [/homes-with-a-suite](https://one-roof-home.vercel.app/homes-with-a-suite) |
| **The multiplayer part** | Buying this house is not a job she does alone | [/the-ones-we-saved](https://one-roof-home.vercel.app/the-ones-we-saved) |

Two more routes exist and are deliberately off the route:
[/why-we-ask-you-to-sign-in](https://one-roof-home.vercel.app/why-we-ask-you-to-sign-in), six
lines on where an account is required, and `/design-system`, which is the token and component sheet.

## Run it

```bash
pnpm install
pnpm dev
```

## The gate

All four green before a commit.

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

## Where things are

| Path | What |
|---|---|
| `src/data/counts.ts` | The one file every listing count comes from. |
| `src/lib/domain/` | Logic that decides what the user is told. Testable without React. |
| `src/components/ui/` | Vendored shadcn primitives. |

## Three claims the code enforces rather than asserts

**No question in front of anything already free.** Every price, permit line, sold figure and drive
time is open with no account. The wall stands at the first press of Save and nowhere earlier,
because Saved is the only thing that has to survive her closing the laptop.

**Who may see what is a function, not a promise.** `agentViewOf` returns what the agent can see. It
has no field for a verdict, a ceiling or a family message, so no agent-facing surface can leak one,
and a test asserts that neither end of the budget bracket nor a priced search criterion appears
anywhere in it.

**The counts nest, and a test says so.** Sixty-four homes in Bendale, thirty-one matching, eleven in
the area the advert drew, eight shown, five saved, three with a city record, one named in prose.
Each is a slice of the one above it, they all live in one file, and `counts.test.ts` fails if two
homes ever share a price or if a home over budget appears in a budgeted search.

## Constraints worth knowing before editing

Read `CLAUDE.md` first. Three that bite hardest:

- **Declared, never inferred.** A life event enters the system only because the user said it.
- **No runtime LLM call.** VOW Rule 8.18 forbids passing listing content to any person or entity, so
  the assistant is a written transcript played back.
- **Every number carries provenance.** A grey chip is somebody else's record, a warm outlined chip is
  ours, and the estimate is a bracket rather than a midpoint.

## Mobile

Responsive, and installable as a PWA. Add to home screen and it launches standalone; one codebase
serves the desktop web app and the mobile app.
