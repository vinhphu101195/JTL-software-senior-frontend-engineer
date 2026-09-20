import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createStore, Provider as JotaiProvider } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateUserForm } from "./CreateUserForm";

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const store = createStore();
  return render(
    <QueryClientProvider client={queryClient}>
      <JotaiProvider store={store}>
        <CreateUserForm />
      </JotaiProvider>
    </QueryClientProvider>,
  );
}

describe("CreateUserForm", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not show the live validation error until the user pauses (debounced), not on every keystroke", () => {
    vi.useFakeTimers();
    renderForm();

    // fireEvent (not userEvent) — userEvent's internal delays don't play well
    // with fake timers, and this test only needs a single synchronous change.
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "ab" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole("alert")).toHaveTextContent("at least 3 characters");
  });

  it("shows a validation error and does not submit when the username is too short", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Username"), "ab");
    await user.click(screen.getByRole("button", { name: /create user/i }));

    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent("at least 3 characters");
    expect(screen.getByLabelText("Username")).toHaveAttribute("aria-invalid", "true");
  });

  it("submits successfully once the username is valid", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Username"), "valid_user");
    await user.click(screen.getByRole("button", { name: /create user/i }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
