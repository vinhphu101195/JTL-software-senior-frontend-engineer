import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCreateTodo } from "./useCreateTodo";
import { todosByUserQueryKey } from "./useTodosByUser";
import { apiCreateTodo } from "../api/todosApi";
import type { ToDoItem } from "../types";

vi.mock("../api/todosApi", () => ({
  apiCreateTodo: vi.fn(),
}));

const mockedApiCreateTodo = vi.mocked(apiCreateTodo);

function renderWithClient(queryClient: QueryClient) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useCreateTodo(), { wrapper });
}

describe("useCreateTodo optimistic update + rollback", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("shows the new item immediately, then reconciles with the server response on success", async () => {
    const assigneeId = "user-1";
    queryClient.setQueryData<ToDoItem[]>(todosByUserQueryKey(assigneeId), []);

    let resolveApi!: (todo: ToDoItem) => void;
    mockedApiCreateTodo.mockImplementation(
      () =>
        new Promise<ToDoItem>((resolve) => {
          resolveApi = resolve;
        }),
    );

    const { result } = renderWithClient(queryClient);
    result.current.mutate({ title: "Write tests", assigneeId });

    await waitFor(() => {
      const cached = queryClient.getQueryData<ToDoItem[]>(todosByUserQueryKey(assigneeId));
      expect(cached).toHaveLength(1);
      expect(cached?.[0]?.title).toBe("Write tests");
      expect(cached?.[0]?.id).toMatch(/^optimistic-/);
    });

    resolveApi({ id: "server-1", title: "Write tests", assigneeId, createdAt: new Date().toISOString() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back the optimistic item when the mutation fails", async () => {
    const assigneeId = "user-1";
    queryClient.setQueryData<ToDoItem[]>(todosByUserQueryKey(assigneeId), []);

    let rejectApi!: (error: Error) => void;
    mockedApiCreateTodo.mockImplementation(
      () =>
        new Promise<ToDoItem>((_resolve, reject) => {
          rejectApi = reject;
        }),
    );

    const { result } = renderWithClient(queryClient);
    result.current.mutate({ title: "This will fail", assigneeId });

    await waitFor(() => {
      const cached = queryClient.getQueryData<ToDoItem[]>(todosByUserQueryKey(assigneeId));
      expect(cached).toHaveLength(1);
    });

    rejectApi(new Error("Failed to save the to-do item. Please try again."));

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cachedAfterRollback = queryClient.getQueryData<ToDoItem[]>(todosByUserQueryKey(assigneeId));
    expect(cachedAfterRollback).toEqual([]);
  });
});
