import { COMMON_ERROR_STATUS_MAP } from "@orpc/client";

import { NotFound } from "@/server/errors";
import { rpcHandler } from "@/server/handlers";

// The typed client's transport (src/lib/orpc.ts). Auth is checked per
// procedure (protectedOS → requireAuth), so a signed-out call gets a typed 401.
async function handle(request: Request) {
  const { response } = await rpcHandler.handle(request, {
    context: { headers: request.headers },
    prefix: "/api/rpc",
  });

  return (
    response ??
    Response.json(new NotFound({ message: "Procedure not found." }).toJSON(), {
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
