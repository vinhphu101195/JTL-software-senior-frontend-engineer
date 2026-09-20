import type { EntityId } from "@jtl/modules-shared";
import type { ToDoItem as ToDoItemModel } from "@jtl/modules-todos";
import { ToDoItem } from "../ToDoItem/ToDoItem";

export interface ToDoListProps {
  todos: ToDoItemModel[];
  /** Injected by the composition root so this package never resolves users itself. */
  resolveAssigneeName?: (assigneeId: EntityId) => string | undefined;
}

export function ToDoList({ todos, resolveAssigneeName }: ToDoListProps) {
  if (todos.length === 0) {
    return <p className="text-sm text-slate-500">No to-do items yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {todos.map((todo) => (
        <ToDoItem key={todo.id} todo={todo} assigneeName={resolveAssigneeName?.(todo.assigneeId)} />
      ))}
    </ul>
  );
}
