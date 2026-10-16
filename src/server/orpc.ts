import "server-only";
import { openapi } from "@orpc/openapi";
import { os } from "@orpc/server";

import { declaredErrorsOnly } from "@/server/core/declared-errors";
import { requireAuth } from "@/server/core/require-auth";
import { BadRequest, Forbidden, InternalServerError } from "@/server/errors";

export type Context = {
  headers: Headers;
};

// Not exported: every API is signed-in only, so procedures start from
// protectedOS. Every endpoint declares 400 and 500; undeclared errors become
// a typed 500 (see core/declared-errors.ts).
const baseOS = os
  .$context<Context>()
  .errors({
    [BadRequest.code]: BadRequest,
    [InternalServerError.code]: InternalServerError,
  })
  .use(declaredErrorsOnly);

// Either Clerk's session cookie (browsers) or its session token as a bearer
// header (other clients).
const SECURITY: Record<string, string[]>[] = [
  { cookieAuth: [] },
  { bearerAuth: [] },
];

// Unauthorized (401) comes from requireAuth; Forbidden (403) from
// GetMethodCsrfProtectionHandlerPlugin, which can block GET procedures.
export const protectedOS = baseOS
  .meta(
    openapi({
      spec: (operation) => ({ ...operation, security: SECURITY }),
    })
  )
  .errors({ [Forbidden.code]: Forbidden })
  .use(requireAuth);
