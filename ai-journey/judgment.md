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
