import { isDefinedError } from "@orpc/client";
import {
  QueryClient,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";

// 30 seconds
const STALE_TIME_MS = 30_000;
const MAX_RETRIES = 2;

// A typed API error (401, 404, 409, 422, …) won't change on retry.
function shouldRetry(failureCount: number, error: unknown) {
  return !isDefinedError(error) && failureCount < MAX_RETRIES;
}

// One per request on the server (prefetch), one per tab in the browser.
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      dehydrate: {
        // Also hand pending prefetches to the client, so a streamed page
        // doesn't fetch the same data twice.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      mutations: { retry: false },
      queries: { retry: shouldRetry, staleTime: STALE_TIME_MS },
    },
  });
}
