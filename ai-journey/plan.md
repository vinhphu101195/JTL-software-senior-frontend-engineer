# Plan

## Approved plan (as produced by Claude Code in plan mode, verbatim)

# Plan: JTL Senior Frontend Take-Home

## Context
This is a greenfield Turborepo monorepo build for the JTL Senior Frontend Engineer
take-home task (see `instructions.md` / the `jtl-senior-frontend-takehome` skill).
The repo currently contains only `instructions.md` and a scaffolded `ai-journey/`
folder — there is no existing code to explore or reuse. The task is explicitly
evaluated on module-boundary discipline, routing/data/UX resilience (esp.
optimistic create + rollback), deliberate Jotai usage, separation of concerns,
accessibility/validation, and written judgment — not feature completeness.
Time box is ~2-4 hours, so structure should stay proportionate: pragmatic
separation of concerns, not DDD ceremony; Atomic Design used where it earns its
keep, not forced everywhere.

## Monorepo layout
```
apps/web/                 shippable app: Vite + TanStack Router routes, composition
packages/users/           User feature: components, hooks (TanStack Query), API, types
packages/todos/           ToDoItem feature: components, hooks (TanStack Query), API, types
packages/shared/          shared types/utils, Query client setup, tsconfig/eslint base
turbo.json, pnpm workspaces (or npm workspaces — pick pnpm for turbo idiom)
```
Each feature package gets one clear entry point (`index.ts`) exporting only what
`apps/web` needs (components + hooks), keeping internals private.

Inside `packages/users` and `packages/todos`:
```
src/
  api/          fake/in-memory client + fetch functions (data access)
  hooks/        TanStack Query hooks (useUser, useCreateUser, useTodosByUser, useCreateTodo...)
  components/
    atoms/      (only if something is genuinely generic — likely thin here)
    molecules/  e.g. FormField (label+input+error)
    organisms/  e.g. UserDetailCard, ToDoItem, ToDoList, CreateUserForm, CreateTodoForm
  types.ts
  index.ts
```
Atomic Design is applied pragmatically: most reusable primitives (Button, Input,
FormField) live once in `packages/shared/components` since both features need
them — avoids duplicating atoms/molecules per package. Feature packages mostly
contain organisms (domain-aware) built from shared atoms/molecules.

## Boundary decision: todos referencing a user (documented explicitly in README)
`packages/todos` must not import `packages/users`. Decision: **`packages/todos`
treats the assignee purely as an opaque `userId: string` foreign key** — it has
no concept of a `User` entity, no dependency on the users package, and its
components accept an already-resolved display value (e.g. `assigneeName`) as a
prop rather than fetching/joining it themselves.

The join happens at the composition root (`apps/web`), which is allowed to
import both feature packages: a page component calls `packages/users`'
`useUser(id)` and `packages/todos`' `useTodosByUser(id)`/list hook, and passes
the resolved user data down as props into the todos package's presentational
components. This keeps both feature packages independently reusable/testable
(todos has zero knowledge users even exist) and puts the cross-feature
knowledge exactly where cross-feature composition belongs — the app shell, via
props, not a sideways import. This will be called out explicitly in the README
as the deliberate boundary call.

## Routing (TanStack Router, in apps/web)
- `/` — home/nav
- `/users/new` — create user form
- `/users/:userId` — user detail view + list of that user's ToDoItems (composed page)
- `/todos/new` — create ToDoItem form (assignee = user ID input)
Router loader/params pass `userId` as a typed route param; navigation via
`Link`/`useNavigate` from TanStack Router, not manual `<a>`/window.location.

## Data fetching & optimistic update (TanStack Query)
- `packages/shared` exports a shared `QueryClient` factory/config (default
  staleTime, retry policy) used once in `apps/web`'s root provider.
- Backend: in-memory fake API module per feature package (`api/`) simulating
  latency and occasional failure (for demonstrating rollback), no real network.
- `useCreateTodo` mutation: `onMutate` optimistically inserts the new ToDoItem
  into the relevant `todosByUser` query cache entry (via `queryClient.setQueryData`
  + snapshot for rollback), `onError` rolls back to the snapshot, `onSettled`
  invalidates to reconcile with server truth. This is the key signal the spec
  calls out — will get explicit manual testing (force a simulated failure and
  confirm rollback) before calling it done.
- User creation and user lookup are plain (non-optimistic) queries/mutations
  with loading/error UI states.

## Jotai (one deliberate cross-cutting concern)
Use a single atom for **"currently selected user"** (e.g. set when creating/
viewing a user, read by the todos page to default the assignee filter/prefill
the create-todo form's assignee field). This is genuinely cross-cutting UI
state (spans the users and todos pages) rather than local form/query state,
which is intentionally kept local via useState/React Query instead of Jotai.

## Styling, validation, accessibility
- TailwindCSS across both packages and the app (shared `tailwind.config`/preset
  from `packages/shared` so utility classes stay consistent).
- Validation: Zod schemas colocated with each form (create-user, create-todo),
  chosen over hand-rolled validation for typed schema + parse errors mapped
  directly to field-level messages with little code — justified in README.
- Accessibility: semantic form elements, `<label htmlFor>`, `aria-invalid`/
  `aria-describedby` wired to Zod error messages, all interactive controls
  keyboard-operable (native elements, no div-buttons).

## Testing
Spec explicitly excludes exhaustive coverage ("outlining your testing strategy
is what we ask for") — so the bulk of testing is a written strategy in the
README/reflection, not an implemented suite. To ground that strategy in real
code rather than pure description, implement a **small representative set**,
not full coverage:
- Vitest + React Testing Library configured once via `packages/shared` (or a
  shared root config) so both feature packages use identical setup.
- One unit test per feature package for a meaningful unit — e.g.
  `packages/users`: the create-user form's validation/error-message rendering;
  `packages/todos`: the `ToDoItem`/list rendering given props (pure
  presentational, no fetching — matches the todos boundary decision above).
- One integration test covering the optimistic-create + rollback flow for
  `useCreateTodo` (mock the fake API to force a failure, assert the item
  appears immediately then is rolled back) — this is the feature the spec
  calls out as the key signal, so it's the one flow worth proving with a real
  test rather than just describing.
- Written reflection then extrapolates from these examples to what a full
  production suite would cover (component unit tests, hook tests, integration
  tests across the users/todos boundary via the app composition layer, and
  what's deliberately left to manual/E2E).

## Build order
1. Scaffold Turborepo workspace (root config, `turbo.json`, `packages/shared`
   with tsconfig/eslint/tailwind preset/Query client, Vitest + RTL base config).
2. `packages/users`: types, fake API, hooks, create-user form, user detail view,
   + its one representative unit test.
3. `packages/todos`: types, fake API, hooks (incl. optimistic create), create
   form, list-by-user, + its one representative unit test and the
   optimistic-create/rollback integration test.
4. `apps/web`: TanStack Router setup, pages composing both packages, Jotai atom
   wiring.
5. README (architecture/trade-offs) + reflection (performance, testing strategy).
6. Fill in `ai-journey/` TODOs (plan/toolchain/judgment) from what actually
   happened during the build.
7. Manual verification pass: run app, exercise create user → create todo →
   optimistic add → simulate failure → rollback → view user's todo list.

## Verification
- `npm run dev` (or pnpm) at root via turbo, exercise all four routes manually
  in-browser.
- Manually trigger a simulated mutation failure (fake API's random/forced
  failure path) to confirm the optimistic ToDoItem is rolled back correctly.
- `tsc`/lint via turbo pipeline to confirm no type errors across packages.
- `vitest run` (via turbo) to confirm the representative unit + integration
  tests pass, including the optimistic-create/rollback assertion.

## Prep work done before implementation started
Before opening Claude Code, I used Claude (chat) to prepare:
1. A personal skill library (~/.claude/skills/) covering the project's tech
   stack — derived from my CV and then gap-checked against this task's
   actual requirements (TanStack Router, TanStack Query, Jotai, Tailwind,
   Zod, accessibility).
2. A project-specific skill (jtl-senior-frontend-takehome) encoding the
   task's requirements, module-boundary rules, and evaluation criteria, so
   Claude Code stays aligned with the spec throughout the session instead of
   drifting.
3. A general spec-driven-bootstrap skill encoding **my own working
   methodology for any task I hand to AI**, not something specific to this
   test: read the spec fully → present a plan → get my confirmation → only
   then implement. I rely on this sequence because skipping the confirm step
   is, in my experience, the most common way AI-assisted work goes off-spec —
   the output looks technically responsive to the text but misses what was
   actually wanted, and that's only discovered after a chunk of
   implementation already has to be reworked. I've encoded it as a reusable
   Claude Code skill so it's applied consistently across projects rather than
   something I have to remember to enforce by hand each time.
4. A sequence of prompts (see prompts.md) to drive the actual Claude Code
   session in that order.

## Package layout & build order actually used
The approved plan above was followed closely, in the order given, with one
addition made before implementation started (see `prompts.md`, "Actual
session prompts" item 4 and the verbatim exchange at entry 4.5): a
"Testing" section was inserted between "Styling, validation, accessibility"
and "Build order" — Vitest + React Testing Library configured once via
`packages/shared/vitest.setup.ts`, one representative unit test per feature
package, and one integration test proving the optimistic-create + rollback
flow specifically (the spec's stated key signal).

Deviations from the plan discovered during implementation (small, mechanical
— not architectural changes):
- The plan's idea of sharing a `vitest.config.base.ts` from `packages/shared`
  and importing it into each package's `vitest.config.ts` was tried first but
  dropped: Vitest's config-file loader resolves bare package subpath imports
  through esbuild during config bundling, which doesn't reliably resolve a
  `.ts` file with no `exports` map entry. Replaced with each package
  referencing the shared setup file by relative path
  (`../shared/vitest.setup.ts`) instead — same sharing, no cross-package
  config-loading risk.
- `packages/todos/src/index.ts` initially re-exported a component named
  `ToDoItem` alongside the `ToDoItem` type from `types.ts`, which `tsc` caught
  as a duplicate identifier (TS2300). Renamed the component's public export to
  `ToDoItemCard`.
- `packages/users`'s `CreateUserForm` imports `jotai` directly (to set
  `selectedUserIdAtom` on successful create) but `jotai` was only declared as
  a dependency of `packages/shared`/`packages/todos` initially — added it to
  `packages/users/package.json` once `pnpm test` surfaced the missing
  resolution.
- The rollback integration test's first version raced: `mockRejectedValue`
  settles the mocked promise immediately, so by the time `waitFor` polled the
  cache, rollback (triggered by `onError`) had often already happened,
  making the "optimistic item is present" assertion flaky. Fixed by holding
  the mock's rejection behind a manually-resolved `Promise` (same pattern the
  success-path test already used for its resolution), so the test can assert
  the optimistic insert before triggering the failure and rollback.

None of these required revisiting the plan's actual architecture (package
boundaries, the todos/users boundary decision, the Jotai atom's placement, or
the optimistic-update design) — the plan held up as approved.
