import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserList } from "./UserList";
import { useUsers } from "@jtl/modules-users";
import type { User } from "@jtl/modules-users";

// packages/users can't reach modules/users' internal api/usersApi.ts (it's
// not exported publicly, by design — see modules/todos's equivalent
// encapsulation). So this UI test mocks the public hook contract it
// actually consumes, useUsers, rather than the fake API underneath it.
vi.mock("@jtl/modules-users", () => ({
  useUsers: vi.fn(),
}));

const mockedUseUsers = vi.mocked(useUsers);

const users: User[] = [
  { id: "user-1-abcdefgh", username: "alice", createdAt: new Date().toISOString() },
  { id: "user-2-abcdefgh", username: "bob", createdAt: new Date().toISOString() },
];

function renderList(onSelectUser?: (user: User) => void) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <UserList onSelectUser={onSelectUser} />
    </QueryClientProvider>,
  );
}

describe("UserList", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a loading state while the list is pending", () => {
    mockedUseUsers.mockReturnValue({ data: undefined, isPending: true, isError: false, error: null } as unknown as ReturnType<
      typeof useUsers
    >);
    renderList();

    expect(screen.getByText("Loading users…")).toBeInTheDocument();
  });

  it("shows an error state if the list fails to load", () => {
    mockedUseUsers.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("Failed to load users."),
    } as unknown as ReturnType<typeof useUsers>);
    renderList();

    expect(screen.getByRole("alert")).toHaveTextContent("Failed to load users.");
  });

  it("shows an empty state when there are no users yet", () => {
    mockedUseUsers.mockReturnValue({ data: [], isPending: false, isError: false, error: null } as unknown as ReturnType<
      typeof useUsers
    >);
    renderList();

    expect(screen.getByText("No users yet.")).toBeInTheDocument();
  });

  it("renders each user with a shortened id, and calls onSelectUser instead of following the link when clicked", async () => {
    mockedUseUsers.mockReturnValue({ data: users, isPending: false, isError: false, error: null } as unknown as ReturnType<
      typeof useUsers
    >);
    const onSelectUser = vi.fn();
    const user = userEvent.setup();
    renderList(onSelectUser);

    const aliceLink = screen.getByRole("link", { name: "alice" });
    expect(aliceLink).toHaveAttribute("href", "/users/user-1-abcdefgh");
    expect(screen.getByText("user-1-a…")).toBeInTheDocument();

    await user.click(aliceLink);
    expect(onSelectUser).toHaveBeenCalledWith(users[0]);
  });

  it("copies the full id to the clipboard and shows a confirmation", async () => {
    mockedUseUsers.mockReturnValue({ data: users, isPending: false, isError: false, error: null } as unknown as ReturnType<
      typeof useUsers
    >);
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderList();

    const [firstCopyButton] = screen.getAllByRole("button", { name: "Copy ID" });
    await user.click(firstCopyButton!);

    expect(writeText).toHaveBeenCalledWith("user-1-abcdefgh");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Copied"));
  });
});
