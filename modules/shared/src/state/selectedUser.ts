import { atom } from "jotai";
import type { EntityId } from "../types";

/**
 * Cross-cutting UI state: which user the app currently has "in focus."
 * Lives in packages/shared (not packages/users) because both packages/users
 * (sets it on create/view) and packages/todos (reads it to prefill the
 * assignee field) need to touch it, and those two feature packages must not
 * import each other directly.
 */
export const selectedUserIdAtom = atom<EntityId | null>(null);
