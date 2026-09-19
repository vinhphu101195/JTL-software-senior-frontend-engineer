import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createStore, Provider as JotaiProvider } from "jotai";
import { selectedUserIdAtom } from "@jtl/shared";
import { describe, expect, it } from "vitest";
import { CreateTodoForm } from "./CreateTodoForm";

function renderForm(store: ReturnType<typeof createStore>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <JotaiProvider store={store}>
        <CreateTodoForm />
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
