import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useUsers, usersQueryKey } from "./useUsers";
import { apiListUsers } from "../api/usersApi";
import type { User } from "../types";

vi.mock("../api/usersApi", () => ({
  apiListUsers: vi.fn(),
}));

const mockedApiListUsers = vi.mocked(apiListUsers);

function renderWithClient(queryClient: QueryClient) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useUsers(), { wrapper });
}

describe("useUsers", () => {
  it("starts pending, then resolves with apiListUsers's data cached under usersQueryKey", async () => {
    const users: User[] = [{ id: "user-1", username: "alice", createdAt: new Date().toISOString() }];
    mockedApiListUsers.mockResolvedValue(users);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderWithClient(queryClient);
    expect(result.current.isPending).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(users);
    expect(queryClient.getQueryData(usersQueryKey)).toEqual(users);
  });

  it("surfaces a failure from apiListUsers as an error state", async () => {
    mockedApiListUsers.mockRejectedValue(new Error("Failed to load users."));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderWithClient(queryClient);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Failed to load users.");
  });
});
