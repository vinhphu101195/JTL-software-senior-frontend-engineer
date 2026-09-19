import { Link, Outlet } from "@tanstack/react-router";

export function RootLayout() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <nav aria-label="Main" className="mb-6 flex gap-4 border-b border-slate-200 pb-4 text-sm font-medium">
        <Link to="/" className="text-slate-700 hover:text-brand-600" activeProps={{ className: "text-brand-600" }}>
          Home
        </Link>
        <Link
          to="/users/new"
          className="text-slate-700 hover:text-brand-600"
          activeProps={{ className: "text-brand-600" }}
        >
          New user
        </Link>
        <Link
          to="/todos/new"
          className="text-slate-700 hover:text-brand-600"
          activeProps={{ className: "text-brand-600" }}
        >
          New to-do
        </Link>
      </nav>
      <Outlet />
    </div>
  );
}
