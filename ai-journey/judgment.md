# Judgment

## Where AI helped
- Scaffolded the repetitive package boilerplate (package.json, tsconfig,
  vitest.config.ts) consistently across `packages/shared`, `packages/users`,
  and `packages/todos` in the same shape each time, which would have been
  tedious and error-prone to keep identical by hand across three packages.
- Produced a correct `onMutate`/`onError`/`onSettled` optimistic-update
  pattern for `useCreateTodo` on the first pass, including snapshotting the
  *specific* affected query key (`todosByUserQueryKey(input.assigneeId)`
  derived from the mutation variables, not a fixed "current user") — which
  matters because the create-todo form lets you assign to any user, not just
  a contextually "selected" one.
- Caught its own resolution risk before it shipped: when the shared Vitest
  setup file first failed to resolve via a bare `@jtl/shared/vitest.setup`
  import, it diagnosed the real cause (no `exports` map, esbuild-based
  config-loading not resolving `.ts` extensions for bare specifiers) rather
  than just retrying, and switched to a relative path.

## Where AI was wrong or unhelpful
- The rollback integration test's first version was flawed: it used
  `mockRejectedValue`, whose promise settles immediately, so the assertion
  that the optimistic item is visible in the cache before rollback happens
  was racing against the rollback itself and failed intermittently (once,
  in the actual test run — see `ai-journey/plan.md`'s "Deviations" section).
  The fix (hold the mock behind a manually-resolved `Promise`, matching the
  pattern already used in the success-path test above it) was reused from
  code already written two tests earlier in the same file — the initial
  version should have used that pattern from the start instead of the
  simpler-looking `mockRejectedValue`.
- Initially proposed sharing a Vitest *config* file (not just the setup file)
  across packages via a package subpath import
  (`@jtl/shared/vitest.config.base`). This looked idiomatic but doesn't work
  reliably with Vitest's config-loading resolution (see above) — caught only
  by actually running `pnpm test`, not by inspection. A more experienced
  reviewer would have flagged the missing `exports` map as a risk before
  writing the import.

## Decisions I made (not corrections — genuine calls between valid options)
- **The users/todos boundary.** The plan (produced by AI, reviewed by me
  before implementation) offered the resolution used in the README: todos
  treats `assigneeId` as an opaque foreign key, and the composition root
  (`apps/web`) resolves the display name via props. I confirmed this over the
  alternative of a shared `UserRef`-shaped type in `packages/shared` because
  a shared type still tempts a feature package to reach for more of that
  entity later ("just add `email` while we're at it"), whereas an opaque
  `string` id genuinely cannot leak users-specific assumptions into todos.
- **Test scope.** I explicitly overrode the plan's first draft, which put
  *all* testing into the written reflection with nothing implemented — a
  literal reading of the spec's "no exhaustive test coverage" non-goal. I
  judged that a completely unimplemented testing strategy, for a task that
  weighs judgment and the optimistic-update flow specifically, would look
  like an unverified claim rather than a demonstrated one. Landed on: written
  strategy for the general case, plus a small deliberately-scoped set of real
  tests for exactly the flow the spec calls "the key signal" — see the
  AskUserQuestion exchange recorded verbatim in `prompts.md` entry **4.5**
  (the question, all three options, and why the "Recommended" option was
  overridden).
- **staleTime of 30s** on the shared `QueryClient` (`packages/shared/src/queryClient.ts`)
  — accepted the AI's default rather than tuning it, since there's no real
  backend/multi-client scenario in this exercise where staleness would
  actually matter; documented as a default rather than a considered choice,
  in contrast to the two decisions above.

## Where I overrode it
A concrete example from before implementation even started: when I asked for
the build prompt to explicitly weave in DDD and the compound component
pattern, the AI flagged that applying them broadly to a ~2-4 hour, small-scope
app risked reading as over-engineering — since the task explicitly states
feature completeness isn't the focus and judgment is. I agreed and had the
prompt rewritten to apply structure only where it's earned (e.g. Atomic
Design for component organization, a light logic/data/presentation
separation) rather than forcing DDD ceremony or compound components
everywhere. This shaped the actual build prompt used (see prompts.md, #1).

During implementation, the concrete override was the test-scope decision
above: the plan as first drafted matched the spec's letter (no implemented
tests) but I judged it under-shot what the task's evaluation criteria
actually reward, and had it revised before any code was written — cheaper
than discovering the gap in the finished submission.

## Independent verification (a second AI review pass, done twice)
Rather than trust the implementation session's own self-reported completeness,
I had a separate AI session (different chat, with actual code execution —
clone the repo, run install/test/typecheck/lint/build, read the source) audit
the finished work against the task's 8 evaluation criteria before submitting.
I did this twice: once right after implementation, and again after fixing
what the first pass found and pushing — to confirm the fixes actually landed
rather than assuming they did.

**First pass** caught three mechanical/documentation issues (not architectural
ones): `ai-journey/SKILL.md` was committed inside `ai-journey/` instead of
`.claude/skills/jtl-senior-frontend-takehome/`; this file had its "Where I
overrode it" section duplicated with a leftover `[TODO]`; and `toolchain.md`/
`plan.md` cited an ambiguous "`prompts.md` entry #4" (the file has two
independently-numbered lists, so "#4" pointed at two different prompts
depending on which list a reader assumed).

**Between passes**, I fixed the file location and the duplicate myself, and
added the real, verbatim `AskUserQuestion` exchange as `prompts.md` entry 4.5
(a genuine, specific record — the actual question, all three options offered,
and why the "Recommended" option was overridden — rather than a paraphrase).

**Second pass** re-cloned the pushed repo, re-ran the full pipeline (still
green), and found the file-location and duplication issues genuinely fixed.
It found one remaining loose end: `plan.md` still cited the ambiguous
"entry #4" even after `judgment.md` had already been updated to the precise
"entry 4.5" — a citation that didn't get updated everywhere it appeared the
first time. Fixed by pointing `plan.md` at the same precise citation.
Everything else — package boundaries, the optimistic-update implementation,
accessibility/validation wiring — was re-confirmed against the actual source
and the real test suite, not just re-read.

I'm recording both passes, not only the clean second one, because "a second
AI check found nothing" and "a second AI check caught something, I fixed it,
and a third look confirmed the fix" are different strength claims — the
second is the one actually demonstrated here.

## Bug found after submission, by me, not by either AI pass: dependencies vs. peerDependencies

Neither the implementation session nor either of the two independent AI
review passes above caught this — I found it myself on a later manual
re-read of `packages/*/package.json`, which is worth recording honestly
rather than folding into the "independent verification" section above as if
AI had already covered it.

**The bug:** `packages/shared`, `packages/users`, and `packages/todos` are
internal library packages — they're never run standalone, only consumed by
`apps/web`. But their `package.json`s listed `react`, `@tanstack/react-query`,
and `jotai` as plain `dependencies`. For a package whose whole point is to be
imported by a host app that provides its own single instance of these
libraries, that's wrong: `react`, `@tanstack/react-query` (its `QueryClient`
context), and `jotai` (its atom/store identity) are all singleton-by-context
libraries — if a library package pins its own copy as a hard dependency
instead of trusting the host's, a bundler that doesn't dedupe perfectly can
end up with two copies of `react` (the classic "Invalid hook call" error), two
`QueryClientProvider` contexts that don't see each other's cache, or — most
relevant to this specific app — a `jotai` atom instance in `packages/shared`
that isn't `===` the instance the host's `Provider` is watching, silently
breaking `selectedUserIdAtom` (the one cross-cutting state atom this whole
task asked me to use deliberately). It happened not to bite here because
`pnpm`'s workspace hoisting deduplicated everything by luck, not by
correctness of the dependency graph — the kind of bug that stays invisible in
a single-app monorepo and then breaks the moment one of these packages is
consumed by a second app or published standalone.

Also found while fixing this: `packages/shared` additionally listed
`react-dom` as a hard dependency despite never importing it anywhere in
`src/` — grepped to confirm. It was only ever needed by `@testing-library/react`
during tests, so it didn't even belong as a runtime dependency, peer or
otherwise, just a dev one.

**The fix** (`packages/shared`, `packages/users`, `packages/todos`, all three
`package.json`s):
- `react`, `@tanstack/react-query`, `jotai` moved from `dependencies` to
  `peerDependencies` (the host, `apps/web`, already declares matching real
  `dependencies` for all three, so nothing downstream changed).
- The same three re-added under `devDependencies` in each package, so
  `pnpm --filter <pkg> test` still works standalone without relying on
  hoisting from a sibling package.
- `react-dom` in `packages/shared` moved out of `dependencies` entirely, into
  `devDependencies` only (test-only, per the grep above).
- `@jtl/shared` (workspace-internal) and `zod` (a plain utility library with
  no context/singleton concerns) correctly stayed as ordinary `dependencies`
  — not every dependency of a library package needs this treatment, only the
  ones with shared runtime identity.
- Verified after the change: `pnpm install` (no peer-dependency warnings,
  since `apps/web` satisfies all three), `pnpm typecheck`, `pnpm test` (all 7
  tests still green), and `pnpm --filter @jtl/web build` (production build
  still succeeds) — the fix is inert for this repo's current single-app setup
  by design, and only matters once a package boundary here is stressed by a
  second consumer.

**Why this is worth its own entry rather than a footnote:** it's a real gap
in something I built and then had independently re-reviewed twice without it
surfacing — a good reminder that "package boundaries" as an evaluation
criterion isn't only about *import* boundaries (which both AI review passes
did check) but also about *dependency* boundaries, which neither pass was
prompted to look at.

**Follow-up, same session:** once `react`/`@tanstack/react-query`/`jotai`
were split into `peerDependencies` + `devDependencies`, I noticed the actual
version strings (`^18.3.1`, `^5.59.0`, `^2.10.0`, etc.) were now duplicated
across even more places than before — each library package's
`peerDependencies` *and* its `devDependencies`, plus `apps/web`'s
`dependencies`. I raised this myself ("it's not enough strictly for
version... set the version in the package root?") and we settled on pnpm's
built-in `catalog:` feature (`pnpm-workspace.yaml`) as the fix, since it's
native to the package manager already in use rather than adding a new tool
(e.g. syncpack) for a problem the workspace tooling already solves — see the
README's "Other notable decisions" for what ended up catalogued and why
single-consumer deps (like `@tanstack/react-router`) deliberately did not.
This is the same shape as the peer-dependency bug above: a real correctness
gap in the dependency graph, caught by re-reading `package.json` files rather
than by running anything.

## Bug found later: assignee field went stale against its own Jotai default

`CreateTodoForm` (`packages/todos`) reads `selectedUserIdAtom` and was using
it to seed the assignee field's default: `useState(selectedUserId ?? "")`.
That reads correctly on a fresh mount (which is all the manual browser
testing earlier in this session happened to exercise — create user →
navigate to a *new* `/todos/new` mount each time), but it's a real Jotai
anti-pattern: a `useState` initializer only runs once, at mount, so if the
atom's value changed *while this form stayed mounted* (e.g. the user was
selected from another part of the UI without a full remount of this
component), the field would silently keep showing the old default. The task
explicitly asks for Jotai to be used "deliberately, not as a dumping
ground" — reading it once and then ignoring further updates is the
under-using-it failure mode of that same requirement, just less obvious than
overusing it.

**The fix**: added a `useEffect` that re-syncs `assigneeId` to
`selectedUserId` whenever the atom changes, guarded by an `assigneeTouched`
ref so it only overwrites the field while the user hasn't typed their own
assignee — otherwise selecting a different user elsewhere would yank away
whatever the user was mid-typing here. The touched flag resets after a
successful submit, so the *next* todo again defaults from the atom rather
than staying pinned to whatever was just typed.

**Test added**: `CreateTodoForm.test.tsx` (previously this component had no
test at all — the plan's "one representative unit test per package" for
`packages/todos` had gone to `ToDoList` instead). Three cases, using a real
Jotai `createStore` so the atom can be mutated mid-test the way the bug
actually manifests: defaults from the atom at mount, stays in sync when the
atom changes *after* mount (the exact case the old code got wrong — this
test would have failed against the pre-fix code), and stops following the
atom once the user has typed their own value. Verified: full workspace
`typecheck`/`test`/`lint` all green (8 tests in `packages/todos`, up from 5).

## Follow-up: extending the same atom-default behavior to HomePage's lookup field

Asked to add the same "default from `selectedUserIdAtom`" behavior to the
`apps/web` home page's "Look up a user by ID" field. At that point the
mount-once-then-resync-via-effect-with-a-touched-ref logic existed in exactly
one place (`CreateTodoForm`); copying it verbatim into `HomePage` would have
made it exist in two places with no shared source of truth — the second
occurrence of a pattern is the actual trigger point the `atomic-design-structure`
skill and this project's own convention use for promoting something into
`packages/shared` (see "Atomic Design, pragmatically" in the README), so I
extracted it as `useDefaultedFromAtom` in `packages/shared/src/hooks` instead
of copy-pasting. `CreateTodoForm` was refactored to use the extracted hook
too, so there's now exactly one implementation of this behavior, not two
independently-maintained copies that could drift.

Didn't add a dedicated test for the hook itself — `CreateTodoForm.test.tsx`'s
three cases already exercise its full contract (default-at-mount, re-sync
while untouched, stop-following once touched) through a real consumer, and
duplicating that as an isolated hook test would just be the same three
assertions with less context. Verified the `HomePage` integration manually in
Chrome instead: created a user, clicked "Home" (client-side nav, no remount
reset), confirmed the lookup field was prefilled with that user's id — plus
the full `typecheck`/`test`/`lint`/`build` pipeline stayed green after the
refactor.

## User-raised performance issue: debounce the text inputs — and a design I proposed that the user correctly rejected

The user pointed out that every keystroke in a form field calls `setState` in
the *parent* form component (`setUsername`, `setTitle`), so that component
re-renders on every character — asked for a `useDebounce` in
`packages/shared`, combined with form handling, with the input owning its
own state and only pushing up to the parent "after the user stops typing,"
comparing it to antd's `setFieldValue`.

**My first design (built, then reverted before committing):** a
`DebouncedInput` molecule wrapping `Input` with its own internal `useState`,
pushing to the parent via `onDebouncedChange` only after the debounce
settled, plus a `forwardRef`/`useImperativeHandle` exposing `flush()` (read
the current value synchronously, for correct submit-time validation) and
`setValue()` (so `CreateTodoForm` could still clear `title` after a
successful add, since the parent's own `setState("")` could no longer reach
state that had moved into the child). Applied only to `username`/`title` —
not the `assigneeId`/`userId` fields, which use `useDefaultedFromAtom` and
must stay controlled so the Jotai atom can push values in from outside, a
capability an uncontrolled field can't have.

**The user's pushback, and why it was right:** *"nếu cuối cùng vẫn là
setState, thì đâu cần phải tạo ra DebouncedInput để làm gì? sao ko sử dụng
input bình thường kết hợp hook useDebounce rồi sau đó setState?"* — if a
`setState` call happens either way, why build `DebouncedInput` instead of a
plain `Input` + `useDebounce` in the parent? I explained the actual
distinction (moving the *raw per-keystroke* state into a child is what stops
the parent from re-rendering per character; debouncing a value *derived*
from parent state that still updates every keystroke doesn't help, because
the parent still re-renders on every keystroke regardless), but then had to
weigh that correctly-explained distinction against what it was actually
buying here: these forms are tiny (one or two cheap fields), so the
re-render `DebouncedInput` prevents is inconsequential, while the
`flush()`/`setValue()` imperative escape hatches it requires are real,
ongoing complexity and two correctness gaps that don't exist in the simpler
version. I recommended reverting to the simpler design myself once I traced
through that trade-off — the user then confirmed. This is the flip side of
"where I overrode AI": here the user's challenge was the correct call, and I
own that my first design solved a problem this codebase doesn't actually
have, at a real complexity cost.

**What actually shipped**: `useDebounce<T>(value, delayMs)`
(`packages/shared/src/hooks/useDebounce.ts`) stays a plain, generic hook —
no new component. `username`/`title` remain ordinary controlled `Input`s in
the parent (state unchanged from before this whole detour). `useDebounce` is
used to derive a *debounced* copy of each value, which drives a `useEffect`
that recomputes *live validation-error display only* — so an error message
doesn't flicker on every keystroke while the user is still typing. Submit
itself always validates the immediate, non-debounced value, so correctness
never depends on debounce timing, and there's no `flush()`/`setValue()`
machinery to maintain because nothing needed an imperative escape hatch.
This does **not** reduce how often the parent re-renders per keystroke
(explained above — it can't, given controlled inputs) but that was never the
part worth optimizing here; the flicker-free error display is the real,
proportionate win.

**Testing:** kept `useDebounce.test.ts` (`packages/shared`'s first test,
using `vi.useFakeTimers()` — this also surfaced that `packages/shared` had
no `vitest.config.ts` of its own until this session, since no earlier test
in that package had touched the DOM). Added one test to
`CreateUserForm.test.tsx` proving the new debounced-error behavior
specifically: typing an invalid value shows no error immediately, only after
`vi.advanceTimersByTime(300)`. Used `fireEvent.change` rather than
`userEvent.type` for that one test — `userEvent`'s internal delays hung
indefinitely under fake timers. The two pre-existing tests needed no changes
and still pass, since submit-time validation was never debounced. Full
`typecheck`/`test`/`lint`/`build` green. Could not verify in an actual
browser this round (the Chrome automation tool had disconnected from this
session) — noted here rather than implied.

## Exploration branch (`explore/multi-platform-dynamic-modules`): two mistakes, both caught before pushing

This branch splits business logic (`modules/todos`, `modules/users`,
`modules/shared`) from Web UI (`packages/todos`, `packages/users`,
`packages/shared`) as an architectural demo — see the root README's
"Exploration branch" section. It does not touch `main`. Two mistakes
happened while doing this, and per an explicit instruction not to scrub the
first one once caught, both are recorded here rather than quietly fixed and
forgotten.

**Mistake 1 — a wrong aggregate number, stated with false confidence.**
After finishing the restructure, I reported the test count as "10→13" when
asked to confirm it hadn't grown (the refactor was scoped as move-only). The
real answer was **13→13** — I'd compared against a stale mid-session count
from before an earlier commit (`c13e3d4`, "add debounce for validation") had
already landed on `main`, not against `main`'s actual state right before
this branch was cut. Caught only because I was asked for an itemized
per-file breakdown instead of being allowed to hand over a bare aggregate —
the itemized table immediately made the arithmetic checkable and the error
obvious. Table (all 5 test files, `main` vs. this branch):

| File | main | branch |
|---|---|---|
| `packages/shared/src/hooks/useDebounce.test.ts` | 2 | 2 |
| `packages/todos/.../CreateTodoForm.test.tsx` | 3 | 3 |
| `packages/todos/.../ToDoList.test.tsx` | 3 | 3 |
| `packages/todos/src/hooks/useCreateTodo.integration.test.tsx` → `modules/todos/...` | 2 | 2 (moved, not modified) |
| `packages/users/.../CreateUserForm.test.tsx` | 3 | 3 |
| **Total** | **13** | **13** |

Lesson: an aggregate number is a claim I should be able to back with an
itemized one on request, and I should produce the itemized version myself
before asserting the aggregate, not only when challenged for it.

**Mistake 2 — a commit whose message didn't match its actual diff.** While
splitting the restructure into five ordered commits (`modules/shared` →
`modules/users` → `modules/todos` → `apps/web` → docs, each with its own
scoped pipeline run), the first commit's message described it as touching
only `modules/shared`/`packages/shared`. `git show --stat` on it afterward
showed it *also* included the raw file relocations (0-line-diff renames) for
`modules/todos` and `modules/users` — because `git mv` stages a move
immediately, and those files had been `git mv`'d earlier in the session,
before the commit-splitting even began; my later `git add <bucket-1-paths>`
only added to the index, it didn't clear what was already staged there. The
commit still passed its own scoped typecheck (a pure rename with 0 content
diff can't break anything), so this wasn't a functional bug — but the
commit's contents didn't match what it claimed. Caught by running
`git show --stat` on the commit right after making it, as a sanity check,
rather than trusting that "I staged the right `git add` command" meant "the
index only contains what I just added." Fixed by `git reset HEAD~1`
(mixed, fully unstaging) and re-staging bucket 1 file-by-file with a
`git diff --cached --stat` check before each commit from that point on —
the same verify-before-trusting habit as mistake 1, applied to git state
instead of a test count.
