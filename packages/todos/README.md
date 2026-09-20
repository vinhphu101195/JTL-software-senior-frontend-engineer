# @jtl/todos

> **On this branch** (`explore/multi-platform-dynamic-modules`), this package
> holds **Web UI only** — components, plus the DOM-specific
> `useDefaultedFromAtom` helper it and `apps/web` share via `@jtl/shared`.
> Business logic (API calls, TanStack Query hooks, Zod validation rules,
> types) lives in [`modules/todos`](../../modules/todos) instead.
>
> See the [root README](../../README.md#exploration-branch-multi-platform-modules)
> for why this split exists. The original task spec described this folder as
> holding "components, hooks, api, types" — that no longer matches on this
> branch specifically, so this note is here so a future reader (including a
> Mobile team) doesn't have to guess why `hooks/`, `api/`, and `types.ts` are
> missing.
