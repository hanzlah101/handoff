import "server-only";
import { createRouterClient } from "@orpc/server";
import { headers } from "next/headers";

import { router } from "@/server/router";

// For Server Components, Server Functions and route handlers: calls the router
// in-process with the request's headers, so Clerk's auth() and every
// middleware run exactly as they do over HTTP.
export const api = createRouterClient(router, {
  context: async () => ({ headers: await headers() }),
});
