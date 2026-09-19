---
name: jtl-senior-frontend-takehome
description: The requirements, module-boundary rules, mandatory tech choices, deliverables, and evaluation criteria for the JTL Senior Frontend Engineer take-home task. Use for any planning, architecture, coding, or review work in this project — to keep decisions aligned with the actual spec instead of drifting or over-building.
---

# JTL Senior Frontend Take-Home — Task Spec

## What to build
Small React app, two connected features, shipped as a Turborepo monorepo:
- **User feature**: form to create a user by username; detail view of a user by ID.
- **ToDoItem feature**: form to create a ToDoItem (title + assignee/user ID); list of ToDoItems assigned to a given user.

## Mandatory tech (non-negotiable — don't substitute)
- React + TypeScript + Vite, inside a Turborepo monorepo.
- **TanStack Router** for routing (e.g. `/users/:id`, `/todos`) — required, not optional.
- **TanStack Query** for data fetching. Backend can be a mock/MSW/json-server/in-memory fake — no real backend needed.
- **Optimistic update is the key signal for this task**: creating a ToDoItem must show it in the list immediately on submit, and correctly roll back if the mutation fails. Get this right — it's called out explicitly as "the key UX and data-consistency signal."
- **Jotai** for at least one cross-cutting UI concern (e.g. currently selected user, an active filter) — used deliberately, not as a dumping ground for state that belongs closer to its feature.
- **TailwindCSS**, applied consistently.
- **Form validation** with meaningful error messages — Zod or something lightweight; justify the choice in the README, don't just pick one silently.
- **Basic accessibility**: semantic HTML, real form labels, keyboard operability.

## Monorepo structure (this is what's being graded most)
```
apps/web        — shippable app: routing, pages, composition
packages/users   — User feature: components, hooks, API calls, types
packages/todos    — ToDoItem feature: components, hooks, API calls, types
packages/shared    — shared types/utils/config (e.g. TanStack Query client setup, tsconfig, eslint config)
```
Hard rule: **`packages/users` and `packages/todos` must never import from each other directly.** Anything they'd need to share goes through `packages/shared`. This boundary is explicitly evaluated — don't casually reach across it "just this once."

`turbo.json` pipeline (build/lint/dev) should stay minimal — do not invest time in caching/tooling sophistication. The package structure is what matters, not pipeline polish.

## Explicitly out of scope — do not build these
- No CI/CD pipeline.
- No real backend (mock/in-memory is expected and sufficient).
- No authentication.
- No pixel-perfect/heavily designed UI — clean and consistent is enough; don't over-invest in visual polish.
- No exhaustive test coverage — a written testing strategy is what's asked for, not an implemented test suite.

Time box is roughly 2–4 hours — if a decision would meaningfully expand scope beyond the spec above, prefer the smaller, spec-aligned option and note the trade-off in the README instead of building it.

## Deliverables checklist
- [ ] Source code in the repo, following the package boundaries above.
- [ ] README (~half a page): key architectural decisions and trade-offs, **especially why the monorepo was split this way** — written as if handing off to another frontend team.
- [ ] Reflection (2–3 sentences/bullets each): performance considerations (re-renders, query caching, code-splitting) and the testing strategy you'd apply in production (what you'd test and how — not implemented).
- [ ] Install/run instructions.
- [ ] `ai-journey/` folder — required, weighted on par with the code itself. Four parts: **the plan** (share any tool-produced plan as-is), **the prompts** (curated key prompts, e.g. `prompts.md`), **the toolchain** (tools/models/skills/MCP servers used and what each was for), **your judgment** (a few honest sentences on where AI helped, was wrong/unhelpful, and where you overrode it). See the `ai-journey-documentation` skill for detailed guidance on writing this well.

## What's actually being evaluated (weight decisions accordingly)
1. Module boundaries — feature packages truly independent, shared logic through `packages/shared`.
2. Routing structured clearly with TanStack Router (routes, params, navigation).
3. Data/UX resilience — loading/error/caching handled sensibly, and a **correct** optimistic create + rollback for ToDoItems.
4. Jotai used deliberately for genuinely cross-cutting state, not everything.
5. Separation of concerns — business logic, data access, and presentation kept apart.
6. Accessibility and validation — semantic, keyboard-operable forms with helpful errors.
7. Judgment shown in the README/reflection — trade-offs named and justified, not just described.
8. The `ai-journey/` folder — how deliberately AI was directed and checked, not how much/little it was used.

Feature completeness is explicitly *not* the main focus — architectural reasoning and these boundaries are.
