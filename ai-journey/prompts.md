# Key Prompts

## 1. Bootstrap — read spec, produce plan
```
Read instructions.md in this repo fully. This is the JTL Senior Frontend
Engineer take-home task — follow the jtl-senior-frontend-takehome skill for
the exact requirements, package boundaries, and what's explicitly out of scope.

Write this as a senior frontend engineer would: deliberate, clean structure,
not just working code. Guidelines:

- Organize components using Atomic Design (atoms/molecules/organisms) inside
  each feature package — see atomic-design-structure skill.
- Keep business logic, data access (TanStack Query hooks), and presentation
  clearly separated within packages/users and packages/todos — a light,
  pragmatic separation, not full DDD/clean-architecture ceremony. This is a
  ~2-4 hour scoped task; don't reach for aggregates, bounded contexts, or the
  compound component pattern unless one specific spot obviously benefits from
  it. Default to the simplest structure that's still clean.
- One boundary decision to make deliberately and document: packages/todos
  can't import packages/users directly, yet a ToDoItem's assignee references
  a real user. Decide how you handle that and state the decision explicitly.
- File structure should be self-explanatory: colocate each component with its
  styles/tests, one clear entry point per package, no dumping-ground
  "utils"/"helpers" files.

Before writing any code, follow spec-driven-bootstrap: give me your plan first
[...]. Wait for my confirmation before implementing.

I've already scaffolded ai-journey/plan.md, prompts.md, toolchain.md, and
judgment.md in this repo with a starting structure and [TODO] markers. As you
work, fill in the [TODO] sections directly in those files instead of keeping
notes elsewhere — leave the parts already written intact unless they turn out
to be inaccurate.

Once I approve this plan and you exit plan mode, your very first action
before touching any other file must be: write the plan exactly as I approved
it into ai-journey/plan.md, replacing the placeholder blockquote at the top —
verbatim, not summarized or cleaned up. Do this yourself; don't ask me to
paste it in manually.
```
*Why this prompt: sets scope, explicitly bounds pattern usage to avoid
over-engineering, forces a plan checkpoint before any code is written, and
points documentation directly at the already-scaffolded files instead of
letting Claude Code freelance its own structure or duplicate notes elsewhere.*

## 2. Plan confirmation
```
Plan looks good, go ahead.
```
*(or the specific adjustment given after reviewing the plan — fill in what
actually happened)*

## 3. Checkpoint after User feature
```
Before moving to the ToDoItem feature, show me the User feature as-is [...]
I want to confirm the pattern before you repeat it for ToDoItems.
```
*Why: catches structural issues early, before they're duplicated into the
second feature.*

## 4. ToDoItem — optimistic update emphasis
```
Now implement the ToDoItem feature. The optimistic create is the most
important part of this task per the spec [...] Show me this before moving on.
```
*Why: this is the task's explicitly stated "key signal" — worth a dedicated,
deliberate checkpoint rather than trusting it to come out right by default.*

## 5. Self-review
```
Self-review the whole implementation using the code-review-checklist,
accessibility-patterns, and zod-form-validation skills [...]
```

## 6. Deliverables
```
Now write the README (~half a page, architectural decisions and trade-offs,
especially why the monorepo is split this way) and the reflection section
(performance considerations, testing strategy).

Then finish ai-journey/: fill in the remaining [TODO] sections in plan.md,
toolchain.md, and judgment.md with what actually happened this session —
don't rewrite the parts already written, only complete what's missing and
correct anything that turned out inaccurate. If you produced a plan-mode
output earlier, make sure it replaced the placeholder section in plan.md
as-is, not summarized.
```
*Why this prompt: closes the loop on the same files scaffolded in prompt #1,
so nothing gets duplicated or rewritten from scratch at the end.*

---
## Actual session prompts (what really happened, vs. the drafted sequence above)

Prompts #2-6 above were drafted *before* the session as a planned sequence of
checkpoints. In the actual run, the session collapsed into fewer, different
turns:

1. Prompt #1 (bootstrap) was sent, but the assistant only produced a *plan*
   for review at that point — it did not yet know about the
   `jtl-senior-frontend-takehome` skill's exact contents until it loaded it,
   confirming the plan aligned with the spec before touching any files.
2. **"proceed with executing this bootstrap prompt"** — the actual go-ahead to
   read `instructions.md`, load skills, and enter plan mode. This replaced the
   drafted "give me your plan" phrasing with a direct instruction after I'd
   already selected/highlighted the relevant prompt text in the editor.
3. **Plan-mode output reviewed and approved as-is** (`ExitPlanMode` /
   "approved") — no changes requested to the plan's structure itself.
4. **"for the plan, there is missing testing for component (unit test and
   integration test)"** — a real mid-plan correction, made *before* any code
   was written. The original plan (correctly, per the spec's non-goals) had
   testing as written-strategy-only with no implemented tests. I raised this
   as a gap; the assistant did not just pick a side — it asked a clarifying
   question rather than guessing (verbatim exchange in **4.5** below), and I
   chose the middle option. This is the one point where the drafted checkpoint
   prompts (#2, #3, #5) were skipped entirely — implementation then proceeded
   end-to-end (scaffold → users → todos → app → manual browser verification →
   docs) in a single continuous pass without intermediate per-feature
   checkpoints, unlike what prompt #3/#4 above anticipated.

### 4.5. The AskUserQuestion exchange this triggered (verbatim)

This is one of the clearest pieces of evidence of deliberate, checked judgment
in this session, so it's recorded here in full rather than only summarized
above — `ai-journey/judgment.md` refers back to this exact entry.

**Question posed by the assistant:**
> The spec explicitly says 'No exhaustive test coverage — outlining your
> testing strategy is what we ask for' as a non-goal. Given that, how do you
> want testing handled in the plan?

**Options offered:**
1. *Written strategy only (Recommended)* — "Keep testing as a written
   reflection section (what I'd test and how, in production) — no test files
   implemented. Matches the spec's stated non-goal and time box exactly."
2. *Written strategy + a few sample tests* — "Add the written reflection AND
   implement a small representative set: one unit test for a component/hook
   per package, plus one integration test covering the optimistic-create +
   rollback flow — enough to demonstrate the approach without full coverage."
3. *Full test setup across the board* — "Set up Vitest + React Testing
   Library in each package with broader unit test coverage for
   components/hooks, plus integration tests for both features. Expands scope
   beyond the stated non-goal and time box."

**My answer:** Option 2, "Written strategy + a few sample tests."

**Why this is worth keeping as its own entry:** the assistant's own
"Recommended" default (option 1) was the literal, safest reading of the
spec's non-goal — and it flagged that explicitly instead of quietly
upgrading scope on its own initiative. I overrode that recommendation
deliberately: a written-only strategy, for a task whose evaluation criteria
weigh the optimistic-update flow as *the* key signal, would leave that
specific claim unverified in the submission. Option 3 was rejected in the
other direction, as expanding past both the non-goal and the 2-4h time box
for coverage nobody asked for. This produced the two tests that ended up in
`packages/todos/src/hooks/useCreateTodo.integration.test.tsx` and one unit
test per feature package (see `ai-journey/plan.md`'s Testing section for what
was actually implemented).

5. **"yes, proceed"** — final go-ahead after the plan was amended with the
   testing section, covering the rest of the build order in one pass.

The main lesson for future runs of this prompt sequence: the drafted
per-feature checkpoints (#3, #4) are good defensive scaffolding, but a
reviewer who's actively reading the plan (as I did here, catching the missing
test coverage before implementation started) can substitute a single sharp
correction at the plan stage for several later checkpoints — cheaper for both
sides than pausing after every feature.
