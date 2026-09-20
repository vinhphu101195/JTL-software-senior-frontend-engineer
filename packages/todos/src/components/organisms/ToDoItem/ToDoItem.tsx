import type { ToDoItem as ToDoItemModel } from "@jtl/modules-todos";

export interface ToDoItemProps {
  todo: ToDoItemModel;
  /**
   * Already-resolved display name for todo.assigneeId, passed in by the
   * composition root (apps/web). This package never fetches or knows about
   * User entities — see the README boundary decision.
   */
  assigneeName?: string;
}

export function ToDoItem({ todo, assigneeName }: ToDoItemProps) {
  const isPending = todo.id.startsWith("optimistic-");

  return (
    <li className="flex items-center justify-between gap-4 rounded-md border border-slate-200 px-3 py-2">
      <div>
        <p className="text-sm font-medium text-slate-900">{todo.title}</p>
        <p className="text-xs text-slate-500">Assigned to {assigneeName ?? todo.assigneeId}</p>
      </div>
      {isPending && (
        <span className="text-xs font-medium text-brand-600" aria-label="Saving">
          Saving…
        </span>
      )}
    </li>
  );
}
