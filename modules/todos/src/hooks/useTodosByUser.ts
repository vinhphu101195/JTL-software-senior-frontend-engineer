import { useQuery } from "@tanstack/react-query";
import type { EntityId } from "@jtl/modules-shared";
import { apiListTodosByUser } from "../api/todosApi";

export const todosByUserQueryKey = (assigneeId: EntityId) => ["todos", "byUser", assigneeId] as const;

export function useTodosByUser(assigneeId: EntityId | undefined) {
  return useQuery({
    queryKey: todosByUserQueryKey(assigneeId ?? ""),
    queryFn: () => apiListTodosByUser(assigneeId as string),
    enabled: Boolean(assigneeId),
  });
}
