import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { RootLayout } from "./routes/RootLayout";
import { HomePage } from "./routes/HomePage";
import { NewUserPage } from "./routes/NewUserPage";
import { UserDetailPage } from "./routes/UserDetailPage";
import { NewTodoPage } from "./routes/NewTodoPage";

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const newUserRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users/new",
  component: NewUserPage,
});

const userDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users/$userId",
  component: () => {
    const { userId } = userDetailRoute.useParams();
    return <UserDetailPage userId={userId} />;
  },
});

const newTodoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/todos/new",
  component: NewTodoPage,
});

const routeTree = rootRoute.addChildren([indexRoute, newUserRoute, userDetailRoute, newTodoRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
