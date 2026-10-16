import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";
import shadcn from "ultracite/oxlint/shadcn";

export default defineConfig({
  extends: [core, react, next, shadcn],
  ignorePatterns: core.ignorePatterns,
  jsPlugins: [
    ...shadcn.jsPlugins,
    { name: "@clerk/next", specifier: "@clerk/eslint-plugin/next" },
  ],
  overrides: [
    {
      files: ["src/**"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            paths: [
              {
                importNames: ["error", "ORPCError"],
                message:
                  "Define errors with defineError() from @/server/errors and throw those classes.",
                name: "@orpc/server",
              },
              {
                importNames: ["os"],
                message:
                  "Build procedures from protectedOS (@/server/orpc) so every API requires a signed-in user.",
                name: "@orpc/server",
              },
            ],
          },
        ],
      },
    },
    {
      files: [
        "src/server/errors.ts",
        "src/server/orpc.ts",
        "src/server/core/**",
      ],
      rules: { "no-restricted-imports": "off" },
    },
    {
      // Columns stay in table order, not alphabetical.
      files: ["src/server/db/schema.ts"],
      rules: { "sort-keys": "off" },
    },
  ],
  rules: {
    // Every page, layout, route handler and server action checks auth
    // (`await auth.protect()`) unless it lives in a public folder: "/", the
    // auth pages and the OAuth callback. src/app/api is listed too: its
    // routes hand off to oRPC, where every procedure is built on protectedOS
    // and answers a signed-out call with a typed 401 (see src/server/orpc.ts).
    "@clerk/next/require-auth-protection": [
      "error",
      {
        protected: ["**"],
        public: [
          "src/app",
          "src/app/(auth)/**",
          "src/app/api/**",
          "src/app/sso-callback/**",
        ],
      },
    ],
    "func-style": "off",
    "react/function-component-definition": [
      "error",
      {
        namedComponents: "function-declaration",
        unnamedComponents: "arrow-function",
      },
    ],
    "typescript/consistent-type-definitions": ["error", "type"],
  },
});
