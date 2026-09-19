import { QueryClient } from "@tanstack/react-query";

/**
 * Single factory so every app gets identical caching defaults instead of
 * each feature package inventing its own staleTime/retry policy.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
