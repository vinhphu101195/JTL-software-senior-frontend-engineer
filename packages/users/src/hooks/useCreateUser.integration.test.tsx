import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCreateUser } from "./useCreateUser";
import { usersQueryKey } from "./useUsers";
import { apiCreateUser, apiListUsers } from "../api/usersApi";
import type { User } from "../types";

vi.mock("../api/usersApi", () => ({
  apiCreateUser: vi.fn(),
  apiListUsers: vi.fn(),
}));

const mockedApiCreateUser = vi.mocked(apiCreateUser);
const mockedApiListUsers = vi.mocked(apiListUsers);

function renderWithClient(queryClient: QueryClient) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useCreateUser(), { wrapper });
}

describe("useCreateUser updates the users list cache directly, without a refetch", () => {
  it("appends the new user to usersQueryKey's cached data on success, and never calls apiListUsers", async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    queryClient.setQueryData<User[]>(usersQueryKey, []);

    const newUser: User = { id: "user-1", username: "alice", createdAt: new Date().toISOString() };
    mockedApiCreateUser.mockResolvedValue(newUser);

    const { result } = renderWithClient(queryClient);
    result.current.mutate("alice");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData<User[]>(usersQueryKey)).toEqual([newUser]);
    expect(mockedApiListUsers).not.toHaveBeenCalled();
  });

  it("appends to whatever the list cache already held, rather than overwriting it", async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const existingUser: User = { id: "user-0", username: "existing", createdAt: new Date().toISOString() };
    queryClient.setQueryData<User[]>(usersQueryKey, [existingUser]);

    const newUser: User = { id: "user-1", username: "alice", createdAt: new Date().toISOString() };
    mockedApiCreateUser.mockResolvedValue(newUser);

    const { result } = renderWithClient(queryClient);
    result.current.mutate("alice");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData<User[]>(usersQueryKey)).toEqual([existingUser, newUser]);
  });
});
