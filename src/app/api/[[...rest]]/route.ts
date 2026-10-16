import { COMMON_ERROR_STATUS_MAP } from "@orpc/client";

import { NotFound } from "@/server/errors";
import { openapiHandler } from "@/server/handlers";

// REST at /api (OpenAPI paths), plus /api/spec.json and /api/docs outside
// production. Auth is checked per procedure (protectedOS → requireAuth).
async function handle(request: Request) {
  const { response } = await openapiHandler.handle(request, {
    context: { headers: request.headers },
    prefix: "/api",
  });

  return (
    response ??
    Response.json(new NotFound({ message: "Route not found." }).toJSON(), {
      status: COMMON_ERROR_STATUS_MAP.NOT_FOUND,
    })
  );
}

export {
  handle as DELETE,
  handle as GET,
  handle as HEAD,
  handle as PATCH,
  handle as POST,
  handle as PUT,
};
