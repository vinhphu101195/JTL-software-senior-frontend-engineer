import { CreateTodoForm } from "@jtl/todos";
import { userExists } from "@jtl/users";

export function NewTodoPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-900">Create a to-do item</h1>
      <CreateTodoForm validateAssignee={userExists} />
    </div>
  );
}
