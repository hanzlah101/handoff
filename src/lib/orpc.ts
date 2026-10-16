import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { BatchLinkPlugin } from "@orpc/client/plugins";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import type { AppRouter } from "@/server/router";

// For Client Components. Server code imports `api` from "@/lib/orpc.server",
// which calls the router in-process instead of over HTTP.
const link = new RPCLink({
  plugins: [
    new BatchLinkPlugin({ groups: [{ condition: () => true, context: {} }] }),
  ],
  url: () => {
    if (typeof window === "undefined") {
      throw new TypeError(
        'The browser oRPC client ran on the server; import "@/lib/orpc.server" there.'
      );
    }

    return "/api/rpc";
  },
});

export const api: RouterClient<AppRouter> = createORPCClient(link);

// TanStack Query options and keys: `orpc.projects.list.queryOptions()`.
export const orpc = createTanstackQueryUtils(api);
