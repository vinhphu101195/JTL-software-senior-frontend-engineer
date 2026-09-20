import type { EntityId } from "@jtl/modules-shared";

/**
 * `assigneeId` is deliberately just an opaque foreign key here — see the
 * boundary decision in the README. Nothing under modules/todos or
 * packages/todos has any concept of a `User` entity or imports the users
 * module/package.
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
