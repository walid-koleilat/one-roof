# One Roof — project rules

A product concept for buying one house for three generations. Rules only; the README describes what
was built and how to run it.

## Product rules — these are the product, not style preferences

**Declared, never inferred.** What the household needs, its budget, its timeline and why it is moving
enter the system only because someone said them. Never derive them from search behaviour, dwell time,
or any other signal.

**The agent sees the requirement, never the ceiling.** `agentViewOf` decides what an agent can see. It
has no field for the top of the budget, a verdict or a family message, and a test fails if one
appears. Do not widen it.

**No third-party LLM API at runtime.** Listing-data licences forbid passing listing content to any
person or entity, and a hosted model is an entity. The assistant is deterministic and scripted, and it
reasons over derived facts, never raw listing content. Do not add an API call to a hosted model.

**Confidence is shown, not hidden.** Every valuation renders with its band and its reasons. When the
band is `insufficient`, the product says so instead of showing a midpoint. `shouldWithholdMidpoint`
exists for this; use it.

**Every number carries provenance.** Numbers enter the UI as `Sourced<T>`, never as bare literals.
Anything `derived` or `mock` is labelled as such where it is rendered.

**Qualification never gates data that is free.** No question stands in front of data that is open.
The account wall stands at the first press of Save and nowhere earlier.

**The assistant opens with a position, not a greeting.** It states what it knows, sourced, then names
the condition that flips the answer. It asks only what would change the output.

## Tone

Write plainly. The family is handling a parent's fall and a move nobody planned. Nothing
celebratory, and no exclamation marks.

## Code rules

- **Never hand-write a version number.** Add dependencies with `pnpm add` / `pnpm add -D` and let
  the resolver write the range. Read `pnpm list --depth=0` after, since an unpinned install can
  resolve backwards.
- **Components:** shadcn primitives in `src/components/ui/` are vendored — edit them freely, but
  keep edits minimal so `shadcn add` stays usable. Composite components go in `src/components/`.
- **Domain logic goes in `src/lib/domain/`** and must be testable without React. Anything that
  decides what the user is told (confidence, valuation, the assistant's positions) belongs there,
  not in a component.
- **Mock data lives in `src/data/`** and is typed. Do not inline figures in components.
- **File and folder names are lowercase kebab-case.** Exceptions are files whose name is a contract
  with a tool: `README.md`, `CLAUDE.md`, `AGENTS.md`, `next.config.ts`.
- **No `any`.** `noUncheckedIndexedAccess` is on; use `!` at a provably total lookup rather than
  turning the flag off.

## The gate

All four must be green before a commit:

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

A green gate ends with a commit. Do not leave verified work uncommitted.

## Working style

**Clear context between tasks rather than running one long session.** Rule-following degrades
measurably as a session grows. Finish a screen, commit, clear.

**Report gate results honestly.** If `pnpm build` fails, say so with the output. Do not describe a
phase as complete when a step was skipped.
