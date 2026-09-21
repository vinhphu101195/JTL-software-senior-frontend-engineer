# JTL Senior Frontend Take-Home

A small Turborepo monorepo: two connected features (users, to-dos) sharing routing, data
fetching, and cross-cutting UI state through a shared package.

## Install and run

```bash
pnpm install
pnpm dev        # starts apps/web on http://localhost:5173
pnpm test       # runs the representative unit + integration tests
pnpm typecheck  # tsc --noEmit across all packages
pnpm lint       # eslint across all packages
```

Requires Node 20+ and pnpm (`corepack enable` or `npm i -g pnpm`).

## Monorepo structure

```
apps/web        shippable app: TanStack Router routes, composition, Jotai/Query providers
packages/users   User feature: types, in-memory API, TanStack Query hooks, form/detail components
packages/todos    ToDoItem feature: same shape as users
packages/shared    shared Button/Input/FormField atoms+molecule, Query client factory,
                   the one Jotai atom, Tailwind preset, base tsconfig
```

I split it this way because the two features (users, to-dos) are the actual product
boundaries in the spec, and everything they'd otherwise duplicate — the query client
config, the form primitives, the Tailwind theme, the base TypeScript config — is
extracted once into `packages/shared` rather than copy-pasted or, worse, imported
sideways between the two feature packages. `apps/web` stays thin: it owns routing and
page-level composition, not business logic.

## The users ↔ todos boundary (the deliberate call)

`packages/todos` must not import `packages/users`, but a `ToDoItem` has an assignee
that's a real user. My resolution: **`packages/todos` treats `assigneeId` as an opaque
foreign key and never fetches or knows about a `User` entity.** Its `ToDoList`/`ToDoItem`
components accept an already-resolved `assigneeName` as a prop; if none is supplied they
render the raw id.

The join happens at the composition root, `apps/web/src/routes/UserDetailPage.tsx`,
which is allowed to import both feature packages: it calls `useUser` (from
`@jtl/users`) and `useTodosByUser` (from `@jtl/todos`) and passes the resolved
username down as a prop into the todos package's presentational components.

I chose props-down composition over, say, a shared `UserRef` type or a users-owned
"assignee resolver" service, because it keeps `packages/todos` genuinely
zero-dependency on users — it can be developed, tested, and reused without users
existing at all — and puts the cross-feature knowledge exactly where cross-feature
composition belongs: the app shell, not either feature package.

**A gap this boundary created, found after the initial submission**: because
`packages/todos` never checks anything about the assignee, creating a to-do with a
made-up `assigneeId` used to succeed silently — the to-do would just never appear
anywhere, since `UserDetailPage` only renders the to-do list after its `useUser`
query for that id succeeds. The fix keeps the boundary intact rather than crossing
it: `CreateTodoForm` takes an optional `validateAssignee?: (id) => Promise<boolean>`
prop, and `NewTodoPage` (the composition root) supplies `@jtl/users`'s new
`userExists()` — a single yes/no check, not a full `User` fetch, so `packages/todos`
still never sees anything shaped like a user. `validateAssignee` runs *before* the
optimistic `mutate()` call, which means every submission pays that round-trip
up front, valid or not; that's deliberate, not an oversight — "does this id exist"
is checkable in advance (an input-validation concern), unlike the network flakiness
`useCreateTodo`'s optimistic rollback exists for (an operation-failure concern
discovered only *during* the attempt), so the two don't belong in the same code
path. See `ai-journey/judgment.md` for the full write-up, including why a `UserList`
picker was considered and rejected as the alternative fix.

## Other notable decisions

- **Jotai for one concern only**: `selectedUserIdAtom` lives in `packages/shared` (not
  `packages/users`) because both `UserDetailPage` (sets it) and `CreateTodoForm`/
  `HomePage` (read it to prefill the assignee/lookup fields) need it, and the two
  feature packages can't share state by importing each other. Everything else (form
  input state, mutation pending/error state) stays local `useState`/React Query —
  Jotai isn't used as a general-purpose store.
- **`useDefaultedFromAtom` (`packages/shared/src/hooks`)**: both `CreateTodoForm`'s
  assignee field and `HomePage`'s "look up a user by ID" field need the same
  behavior — default from `selectedUserIdAtom`, keep following it if it changes while
  the field is mounted, but stop the moment the user types their own value. A plain
  `useState(atomValue ?? "")` initializer only reads the atom once at mount and goes
  stale after that; this hook re-syncs via a `useEffect` guarded by a `touched` ref.
  Extracted into `packages/shared` once it was needed in a second place (both a
  todos-package component and an apps/web page), per the same "promote after actual
  reuse" rule the component layers follow — not written speculatively upfront.
- **`useDebounce` (`packages/shared/src/hooks`) debounces validation feedback, not
  typing**: `username` and to-do `title` stay ordinary controlled inputs — a
  `useEffect` derives a debounced copy of each value and uses it to decide when to
  show a live validation error, so the message doesn't flicker on every keystroke
  while typing. Submit always validates the immediate (non-debounced) value, so
  correctness never depends on debounce timing. I initially built a `DebouncedInput`
  molecule that moved the raw keystroke state into a child component (to actually
  stop the parent from re-rendering per character), but reverted it: these forms are
  small enough that the prevented re-render is inconsequential, while the
  `forwardRef`/`flush()`/`setValue()` machinery it required was real, ongoing
  complexity for a problem this codebase doesn't have at this scale. See
  `ai-journey/judgment.md` for the full back-and-forth.
- **Optimistic create + rollback** (`packages/todos/src/hooks/useCreateTodo.ts`):
  `onMutate` snapshots the affected user's cached to-do list and inserts an optimistic
  item (id prefixed `optimistic-` so the UI can show a "Saving…" affordance);
  `onError` restores the snapshot; `onSettled` invalidates to reconcile with the
  server. The fake API randomly fails ~15% of creates specifically so the rollback
  path is observable in normal use, not just in tests.
- **Zod for validation**: chosen over hand-rolled validation because both forms need
  more than one rule (length, character set, required), and Zod gives typed,
  per-field error messages via `safeParse` for very little code. For a form this small
  a hand-rolled validator would have been comparable effort, but Zod scales better if
  either form grows.
- **No real backend**: each feature package owns an in-memory fake API module
  (`api/*Api.ts`) with artificial latency, per the spec. This means state resets on a
  full page reload — acceptable for this exercise, called out here so it isn't
  mistaken for a bug during review.
- **Atomic Design, pragmatically**: shared, domain-agnostic primitives (`Button`,
  `Input`, `FormField`) live once in `packages/shared/src/components`; each feature
  package mostly contains organisms (`CreateUserForm`, `UserDetailCard`,
  `CreateTodoForm`, `ToDoList`) that compose them. I didn't force atoms/molecules
  layers inside the feature packages themselves — there wasn't enough generic,
  feature-agnostic UI there to warrant it.
- **`react`/`@tanstack/react-query`/`jotai` are `peerDependencies` of the library
  packages**, not plain `dependencies` — `packages/shared`, `packages/users`, and
  `packages/todos` are only ever consumed by `apps/web`, which owns the single real
  instance of each. Pinning a separate copy inside a library package risks two React
  copies or two Jotai atom instances if a bundler doesn't dedupe perfectly; declaring
  them as peers makes the host responsible instead. They're re-declared under each
  package's own `devDependencies` so `pnpm --filter <pkg> test` still runs standalone.
- **Shared version numbers live in one place**: `pnpm-workspace.yaml`'s `catalog:`
  entry is the single source of truth for every dependency version that appears in
  2+ `package.json` files (React, TanStack Query, Jotai, Zod, TypeScript, Vitest,
  Testing Library, etc.); each package references it as `"react": "catalog:"` instead
  of repeating the version string. A dependency used by only one package (e.g.
  `@tanstack/react-router`, only in `apps/web`) stays a plain version there — the
  catalog is for genuinely shared versions, not everything.

## Reflection

**Performance considerations**: Query results are cached per-key (`users/detail/:id`,
`todos/byUser/:id`) with a 30s `staleTime`, so re-visiting a user/to-do list doesn't
re-fetch immediately. The optimistic update avoids a loading spinner on the common
path (successful create). Form fields re-render their owning form on every keystroke
(inherent to controlled inputs) — at this app's scale that's inconsequential, so
`useDebounce` is spent on the part that's actually worth smoothing: live validation
error display, not typing itself (see "Other notable decisions" above, including a
more invasive design I tried and reverted). Components are otherwise largely
presentational and re-render only on their own prop/query changes — nothing sits in a
global re-render-everything store. At larger scale I'd add route-level code-splitting
(`apps/web` currently loads all four pages eagerly, which was left simple over
`React.lazy` given the app's tiny page count) and consider `select` on the query hooks
if list payloads grew large.

**Testing strategy** (only a representative slice is implemented — see
`packages/users/src/components/organisms/CreateUserForm/CreateUserForm.test.tsx`,
`packages/todos/src/components/organisms/{ToDoList,CreateTodoForm}` tests,
`packages/todos/src/hooks/useCreateTodo.integration.test.tsx`, and
`packages/shared/src/hooks/useDebounce.test.ts`):
- **Unit**: form components against their Zod schemas (empty/invalid/valid input →
  correct error text and `aria-invalid`); presentational components (`ToDoList`,
  `UserDetailCard`) against props, independent of any network.
- **Integration**: the optimistic-create + rollback flow end-to-end through
  `useCreateTodo` and a real `QueryClient` (mocking only the fake API's network call) —
  this is the one flow explicitly called out as the key signal, so it gets a real test
  rather than only a description.
- **What I'd add for production**: hook tests for `useUser`/`useTodosByUser` loading
  and error states; a boundary test asserting `packages/todos` has no static import of
  `packages/users` (e.g. a dependency-cruiser rule in CI); component tests for
  `UserDetailPage` covering the users↔todos prop-resolution composition; and a couple
  of Playwright/Cypress E2E specs for the two golden paths (create user → create
  assigned to-do → see it in the list; create-to-do failure → confirm the optimistic
  item disappears in the real DOM, not just the query cache).

## AI usage

See [`ai-journey/`](./ai-journey) for the plan, prompts, toolchain, and judgment notes.
