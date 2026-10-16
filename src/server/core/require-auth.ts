import { auth } from "@clerk/nextjs/server";
import { os } from "@orpc/server";

import { Unauthorized } from "@/server/errors";
import type { Context } from "@/server/orpc";

// Clerk resolves the session from the request (the `__session` cookie in the
// browser, or an `Authorization: Bearer <session token>` header), so this
// works the same in the route handlers and in in-process server calls.
export const requireAuth = os
  .$context<Context>()
  .errors({ [Unauthorized.code]: Unauthorized })
  .middleware(async ({ next }) => {
    const { isAuthenticated, sessionId, userId } = await auth();

    if (!isAuthenticated) {
      throw new Unauthorized();
    }

    return await next({ context: { auth: { sessionId, userId } } });
  });
