import type { JsonSchema } from "@orpc/json-schema";
import { OpenAPIGenerator } from "@orpc/openapi";
import type { OpenAPIErrorBodyDefinition } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod";

import { ERROR_STATUSES } from "@/server/errors";
import { router } from "@/server/router";

export const zodConverter = new ZodToJsonSchemaConverter();

const openapiGenerator = new OpenAPIGenerator({ converters: [zodConverter] });

function errorBodySchema({
  code,
  dataJsonSchema,
  dataOptional,
}: OpenAPIErrorBodyDefinition) {
  const hasData =
    typeof dataJsonSchema === "object" &&
    Object.keys(dataJsonSchema).length > 0;

  return {
    properties: {
      code: { const: code },
      defined: { const: true },
      message: { type: "string" },
      ...(hasData ? { data: dataJsonSchema } : {}),
    },
    required: [
      "defined",
      "code",
      "message",
      ...(hasData && !dataOptional ? ["data"] : []),
    ],
    title: code,
    type: "object",
  } satisfies JsonSchema;
}

export async function generateOpenAPISpec() {
  return await openapiGenerator.generate(router, {
    base: {
      components: {
        securitySchemes: {
          bearerAuth: {
            description:
              "A Clerk session token (`getToken()`), as `Authorization: Bearer <token>`.",
            scheme: "bearer",
            type: "http",
          },
          cookieAuth: {
            description: "Clerk's session cookie, set when you sign in.",
            in: "cookie",
            name: "__session",
            type: "apiKey",
          },
        },
      },
      info: {
        description:
          "Handoff backend API. Every endpoint needs a signed-in user.",
        title: "Handoff API",
        version: "1.0.0",
      },
      servers: [{ url: "/api" }],
    },
    customErrorResponseBodySchema: (definitions) => ({
      oneOf: definitions.map(errorBodySchema),
    }),
    errorStatusMap: ERROR_STATUSES,
  });
}
