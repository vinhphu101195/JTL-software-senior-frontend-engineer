import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // jsdom only because useUsers.test.tsx/useCreateUser.integration.test.tsx
    // use @testing-library/react's renderHook, which needs a DOM to mount
    // into — not because anything in this module touches the DOM itself. A
    // future React Native app would run these exact hook files, tested with
    // @testing-library/react-native instead.
    environment: "jsdom",
    globals: true,
  },
});
