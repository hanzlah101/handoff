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
  rules: {
    // Every page, layout, route handler and server action checks auth
    // (`await auth.protect()`) unless it lives in a public folder: "/", the
    // auth pages and the OAuth callback.
    "@clerk/next/require-auth-protection": [
      "error",
      {
        protected: ["**"],
        public: ["src/app", "src/app/(auth)/**", "src/app/sso-callback/**"],
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
