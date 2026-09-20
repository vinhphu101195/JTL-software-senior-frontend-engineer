import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserList } from "./UserList";
import { apiListUsers } from "../../../api/usersApi";
import type { User } from "../../../types";

vi.mock("../../../api/usersApi", () => ({
  apiListUsers: vi.fn(),
}));

const mockedApiListUsers = vi.mocked(apiListUsers);

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
    mockedApiListUsers.mockImplementation(() => new Promise(() => {}));
    renderList();

    expect(screen.getByText("Loading users…")).toBeInTheDocument();
  });

  it("shows an error state if the list fails to load", async () => {
    mockedApiListUsers.mockRejectedValue(new Error("Failed to load users."));
    renderList();

    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent("Failed to load users.");
  });

  it("shows an empty state when there are no users yet", async () => {
    mockedApiListUsers.mockResolvedValue([]);
    renderList();

    expect(await screen.findByText("No users yet.")).toBeInTheDocument();
  });

  it("renders each user with a shortened id, and calls onSelectUser instead of following the link when clicked", async () => {
    mockedApiListUsers.mockResolvedValue(users);
    const onSelectUser = vi.fn();
    const user = userEvent.setup();
    renderList(onSelectUser);

    const aliceLink = await screen.findByRole("link", { name: "alice" });
    expect(aliceLink).toHaveAttribute("href", "/users/user-1-abcdefgh");
    expect(screen.getByText("user-1-a…")).toBeInTheDocument();

    await user.click(aliceLink);
    expect(onSelectUser).toHaveBeenCalledWith(users[0]);
  });

  it("copies the full id to the clipboard and shows a confirmation", async () => {
    mockedApiListUsers.mockResolvedValue(users);
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderList();

    const [firstCopyButton] = await screen.findAllByRole("button", { name: "Copy ID" });
    await user.click(firstCopyButton!);

    expect(writeText).toHaveBeenCalledWith("user-1-abcdefgh");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Copied"));
  });
});
