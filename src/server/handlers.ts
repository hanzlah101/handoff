import "server-only";
import { SmartCoercionHandlerPlugin } from "@orpc/json-schema";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferenceHandlerPlugin } from "@orpc/openapi/plugins";
import { RPCHandler } from "@orpc/server/fetch";
import {
  BatchHandlerPlugin,
  GetMethodCsrfProtectionHandlerPlugin,
} from "@orpc/server/plugins";

import { env } from "@/env";
import { declaredErrorsPlugin } from "@/server/core/declared-errors";
import { generateOpenAPISpec, zodConverter } from "@/server/core/openapi";
import { ERROR_STATUSES } from "@/server/errors";
import { router } from "@/server/router";

// Plugins listed later wrap earlier ones: declaredErrorsPlugin goes after
// GetMethodCsrfProtectionHandlerPlugin so its 403 maps to the declared Forbidden.

export const rpcHandler = new RPCHandler(router, {
  errorStatusMap: ERROR_STATUSES,
  plugins: [
    new BatchHandlerPlugin(),
    new GetMethodCsrfProtectionHandlerPlugin(),
    declaredErrorsPlugin(),
  ],
});

export const openapiHandler = new OpenAPIHandler(router, {
  errorStatusMap: ERROR_STATUSES,
  plugins: [
    new SmartCoercionHandlerPlugin({ converters: [zodConverter] }),
    new GetMethodCsrfProtectionHandlerPlugin(),
    declaredErrorsPlugin(),
    new OpenAPIReferenceHandlerPlugin({
      allow: env.NODE_ENV !== "production",
      docsPath: "/docs",
      spec: generateOpenAPISpec,
    }),
  ],
});
