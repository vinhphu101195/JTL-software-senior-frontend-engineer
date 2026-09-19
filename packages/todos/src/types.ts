import type { EntityId } from "@jtl/shared";

/**
 * `assigneeId` is deliberately just an opaque foreign key here — see the
 * boundary decision in the README. packages/todos has no concept of a
 * `User` entity and never imports packages/users.
 */
export interface ToDoItem {
  id: EntityId;
  title: string;
  assigneeId: EntityId;
  createdAt: string;
}

export interface CreateTodoInput {
  title: string;
  assigneeId: EntityId;
}
