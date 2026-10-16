import { openapi } from "@orpc/openapi";

import { sessionSchema } from "@/server/modules/session/session.schemas";
import { protectedOS } from "@/server/orpc";

const TAGS = ["Session"];

const get = protectedOS
  .meta(
    openapi({
      description: "The signed-in user's Clerk user and session IDs.",
      method: "GET",
      path: "/session",
      summary: "Get the current session",
      tags: TAGS,
    })
  )
  .output(sessionSchema)
  .handler(({ context }) => context.auth);

export const sessionRouter = { get };
