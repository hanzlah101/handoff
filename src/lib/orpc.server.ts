import "server-only";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { headers } from "next/headers";

import { router } from "@/server/router";

// For Server Components, Server Functions and route handlers: calls the router
// in-process with the request's headers, so Clerk's auth() and every
// middleware run exactly as they do over HTTP.
export const api = createRouterClient(router, {
  context: async () => ({ headers: await headers() }),
});

// Same keys as the browser's `orpc`, for prefetching in Server Components.
export const orpc = createTanstackQueryUtils(api);
