import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToDoList } from "./ToDoList";
import type { ToDoItem } from "@jtl/modules-todos";

const todos: ToDoItem[] = [
  { id: "1", title: "Write README", assigneeId: "user-1", createdAt: new Date().toISOString() },
  { id: "optimistic-2", title: "Ship feature", assigneeId: "user-2", createdAt: new Date().toISOString() },
];

describe("ToDoList", () => {
  it("renders an empty state when there are no todos", () => {
    render(<ToDoList todos={[]} />);
    expect(screen.getByText("No to-do items yet.")).toBeInTheDocument();
  });

  it("renders each todo, resolving the assignee name via the injected prop rather than fetching it", () => {
    render(<ToDoList todos={todos} resolveAssigneeName={(id) => (id === "user-1" ? "alice" : undefined)} />);

    expect(screen.getByText("Write README")).toBeInTheDocument();
    expect(screen.getByText("Assigned to alice")).toBeInTheDocument();
    // Falls back to the raw id when no resolver entry is available.
    expect(screen.getByText("Assigned to user-2")).toBeInTheDocument();
  });

  it("marks an optimistic (not-yet-confirmed) todo as saving", () => {
    render(<ToDoList todos={todos} />);
    expect(screen.getByLabelText("Saving")).toBeInTheDocument();
  });
});
