import type { EntityId } from "@jtl/modules-shared";
import type { CreateTodoInput, ToDoItem } from "../types";

/**
 * In-memory fake backend. Randomly fails create requests to make the
 * optimistic-update rollback path observable in real usage, not just in
 * tests (which force failure deterministically by mocking this module).
 */
const store = new Map<string, ToDoItem>();
const RANDOM_FAILURE_RATE = 0.15;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiListTodosByUser(assigneeId: EntityId): Promise<ToDoItem[]> {
  await delay(300);
  return Array.from(store.values()).filter((todo) => todo.assigneeId === assigneeId);
}

export async function apiCreateTodo(input: CreateTodoInput): Promise<ToDoItem> {
  await delay(400);
  if (Math.random() < RANDOM_FAILURE_RATE) {
    throw new Error("Failed to save the to-do item. Please try again.");
  }
  const todo: ToDoItem = {
    id: crypto.randomUUID(),
    title: input.title,
    assigneeId: input.assigneeId,
    createdAt: new Date().toISOString(),
  };
  store.set(todo.id, todo);
  return todo;
}
