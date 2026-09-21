import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createStore, Provider as JotaiProvider } from "jotai";
import { selectedUserIdAtom } from "@jtl/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateTodoForm, type CreateTodoFormProps } from "./CreateTodoForm";

function renderForm(store: ReturnType<typeof createStore>, props: CreateTodoFormProps = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <JotaiProvider store={store}>
        <CreateTodoForm {...props} />
      </JotaiProvider>
    </QueryClientProvider>,
  );
}

describe("CreateTodoForm — assignee defaults from the shared Jotai atom", () => {
  it("defaults the assignee field to whatever selectedUserIdAtom holds at mount", () => {
    const store = createStore();
    store.set(selectedUserIdAtom, "user-1");
    renderForm(store);

    expect(screen.getByLabelText("Assignee (user ID)")).toHaveValue("user-1");
  });

  it("stays in sync with the atom if it changes later, as long as the user hasn't typed their own value", () => {
    const store = createStore();
    store.set(selectedUserIdAtom, "user-1");
    renderForm(store);

    act(() => {
      store.set(selectedUserIdAtom, "user-2");
    });

    expect(screen.getByLabelText("Assignee (user ID)")).toHaveValue("user-2");
  });

  it("stops following the atom once the user edits the field themselves", async () => {
    const user = userEvent.setup();
    const store = createStore();
    store.set(selectedUserIdAtom, "user-1");
    renderForm(store);

    const assigneeInput = screen.getByLabelText("Assignee (user ID)");
    await user.clear(assigneeInput);
    await user.type(assigneeInput, "custom-user");

    act(() => {
      store.set(selectedUserIdAtom, "user-2");
    });

    expect(assigneeInput).toHaveValue("custom-user");
  });
});

describe("CreateTodoForm — title validation announcement priority", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("announces the debounced live-typing title error politely, not via role=alert", () => {
    vi.useFakeTimers();
    renderForm(createStore());

    // A title over 120 chars is non-empty, so the debounce effect's own
    // guard (skip when empty) doesn't suppress it — this is the only way to
    // trigger a live-typing error for this field.
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "a".repeat(121) } });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    const liveError = screen.getByText(/120 characters or fewer/i);
    expect(liveError).toHaveAttribute("aria-live", "polite");
    expect(liveError).not.toHaveAttribute("role", "alert");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the submit-time title error via role=alert", async () => {
    const user = userEvent.setup();
    renderForm(createStore());

    // Submitting with both fields empty also raises the assignee field's own
    // (always-assertive) error, so query the title error by text specifically
    // rather than by role — there are two role="alert" elements at this point.
    await user.click(screen.getByRole("button", { name: /add to-do/i }));

    const error = await screen.findByText("Title is required.");
    expect(error).toHaveAttribute("role", "alert");
    expect(error).not.toHaveAttribute("aria-live", "polite");
  });
});

describe("CreateTodoForm — validateAssignee (does this user id actually exist)", () => {
  async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText("Title"), "Write tests");
    await user.type(screen.getByLabelText("Assignee (user ID)"), "some-id");
    await user.click(screen.getByRole("button", { name: /add to-do|checking assignee/i }));
  }

  it("blocks submission and shows an error when validateAssignee resolves false, without ever calling mutate", async () => {
    const validateAssignee = vi.fn().mockResolvedValue(false);
    const user = userEvent.setup();
    renderForm(createStore(), { validateAssignee });

    await fillAndSubmit(user);

    expect(validateAssignee).toHaveBeenCalledWith("some-id");
    const error = await screen.findByText("No user found with this ID.");
    expect(error).toHaveAttribute("role", "alert");
    // The title field, valid, should show no error of its own.
    expect(screen.queryByText("Title is required.")).not.toBeInTheDocument();
  });

  it("submits normally once validateAssignee resolves true", async () => {
    const validateAssignee = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();
    renderForm(createStore(), { validateAssignee });

    await fillAndSubmit(user);

    expect(validateAssignee).toHaveBeenCalledWith("some-id");
    await screen.findByText("Adding…"); // optimistic insert kicked off
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not call validateAssignee when the schema itself already rejects the submission", async () => {
    const validateAssignee = vi.fn();
    const user = userEvent.setup();
    renderForm(createStore(), { validateAssignee });

    // Both fields empty — Zod fails before validateAssignee would ever run.
    await user.click(screen.getByRole("button", { name: /add to-do/i }));
    await screen.findByText("Title is required.");

    expect(validateAssignee).not.toHaveBeenCalled();
  });
});
