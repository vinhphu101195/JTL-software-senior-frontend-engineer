import { useNavigate } from "@tanstack/react-router";
import { CreateUserForm } from "@jtl/users";

export function NewUserPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-900">Create a user</h1>
      <CreateUserForm onCreated={(user) => void navigate({ to: "/users/$userId", params: { userId: user.id } })} />
    </div>
  );
}
