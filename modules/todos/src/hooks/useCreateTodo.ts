import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiCreateTodo } from "../api/todosApi";
import { todosByUserQueryKey } from "./useTodosByUser";
import type { CreateTodoInput, ToDoItem } from "../types";

interface OptimisticContext {
  previous: ToDoItem[] | undefined;
}

/**
 * The spec's key signal: the new item must appear immediately on submit and
 * roll back correctly if the mutation fails. onMutate snapshots the current
 * cache for the affected assignee's list, inserts an optimistic item, and
 * onError restores the snapshot; onSettled reconciles with server truth.
 */
export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation<ToDoItem, Error, CreateTodoInput, OptimisticContext>({
    mutationFn: (input) => apiCreateTodo(input),
    onMutate: async (input) => {
      const queryKey = todosByUserQueryKey(input.assigneeId);
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<ToDoItem[]>(queryKey);
      const optimisticTodo: ToDoItem = {
        id: `optimistic-${crypto.randomUUID()}`,
        title: input.title,
        assigneeId: input.assigneeId,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<ToDoItem[]>(queryKey, (old = []) => [...old, optimisticTodo]);

      return { previous };
    },
    onError: (_error, input, context) => {
      queryClient.setQueryData(todosByUserQueryKey(input.assigneeId), context?.previous);
    },
    onSettled: (_data, _error, input) => {
      void queryClient.invalidateQueries({ queryKey: todosByUserQueryKey(input.assigneeId) });
    },
  });
}
