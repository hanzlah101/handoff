<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Handoff — Agent Guide

Handoff runs browser automations that know when to ask a human: when an agent hits a login, captcha or 2FA, the run pauses, a person fixes it in the live browser, and the agent carries on.

## Commands

```
bun install
bun run dev         # http://localhost:3000
bun run build
bun run lint        # ultracite: oxlint (type-aware) + oxfmt format check
bun run format      # ultracite: auto-fix lint + format
bun run typecheck   # next typegen + tsc --noEmit
bun run db:up       # start local Postgres 18 (compose.yaml, localhost:5432) and wait until healthy
bun run db:down     # stop it (data stays in the postgres-data volume)
bun run db:generate # SQL migration in drizzle/ from schema changes (--name <what>)
bun run db:migrate  # apply pending migrations to DATABASE_URL
bun run db:studio   # browse data
```

Run `bun run format && bun run lint && bun run typecheck` before finishing any task. Use bun for everything (no npm, pnpm or yarn; `bun.lock` is the only lockfile).

## Code style

Linting/formatting is **Ultracite on Oxlint + Oxfmt** (no Biome, ESLint, or Prettier). Config: `oxlint.config.mts` (presets `core`, `react`, `next`, `shadcn` + the `@shadcn/lint` plugin) and `oxfmt.config.mts` (sorts Tailwind classes against `src/app/globals.css`). `@shadcn/lint` flags class names Tailwind doesn't know.

- Types: `type` aliases, not `interface` (lint-enforced; the only exception is a `declare module` augmentation, which needs `interface` and gets a `// oxlint-disable-next-line typescript/consistent-type-definitions` on that line). Derive with `Pick`/`Omit`/`Extract`/`z.infer`/`$inferSelect` instead of redeclaring shapes.
- `function` declarations for named functions (convention, `func-style` is off) and components (enforced); arrows only inline (e.g. callbacks).
- The rules enforce kebab-case filenames, sorted object keys, no `||` for defaults (use `??`), no unsafe `as` casts.
- Source lives in `src/` (`src/app`, `src/components`, `src/lib`). Import with the `@/` alias only (`@/components/ui/button` → `src/components/ui/button.tsx`), never `./` or `../`.
- Typed routes are on (`typedRoutes` in `next.config.ts`): `href`s on `<Link>`, `redirect()` and `router.push()` are checked against real routes, and `PageProps<"/path">` / `LayoutProps<"/path">` type route props. `bun run typecheck` runs `next typegen` first so the route types exist.

### JSX text escaping

Escape apostrophes and quotes in JSX text content. Use `&apos;` for apostrophes and `&quot;` for quotes (e.g. `you&apos;re`, `doesn&apos;t`). This applies only to literal text between JSX tags, not to string attribute values or JS strings.

## UI

shadcn `aria-nova` style: components are built on **React Aria Components** (`react-aria-components`), icons from `@tabler/icons-react`, class merging with `cn` (`@/lib/utils`). Add components with `bunx shadcn@latest add <name>`, then match them to the existing ones in `src/components/ui/`.

- Theme: the "cobalt" palette, all in `src/app/globals.css` (shadcn's single-file layout: imports, `@theme inline` tokens, light `:root` and `.dark` palettes, then `@layer base`). Use the tokens (`bg-primary`, `text-muted-foreground`, `ring-input`), never raw colours.
- Fonts: Bricolage Grotesque (`font-heading`, applied to `h1`–`h3`) and Figtree (`font-sans`) via `next/font` in `src/app/layout.tsx`.
- Dark mode: `next-themes` sets the `.dark` class on `<html>`, following the OS until the user picks.
- `src/components/ui/` files that pass render-prop functions to React Aria (`composeRenderProps`) start with `"use client"`, so server components can render them.

## Brand

The mark is two cursors passing control: the AI's in white, the human's in amber (`#e9b452`), on a cobalt tile (`#2f6be0` → `#1043a8`). `src/app/icon.svg` is the source; `LogoMark` (`src/components/logo.tsx`) is the same drawing for the UI. The raster icons are rendered from `icon.svg` (keep them in sync when it changes): `src/app/favicon.ico` (16/32/48), `src/app/apple-icon.png` (180, square, iOS rounds it), `public/icon-192.png` and `public/icon-512.png` (used by `src/app/manifest.ts`).

## Environment

Variables are validated with `@t3-oss/env-nextjs` + Zod in `src/env.ts`; import `env` from `@/env`, never read `process.env` directly. `next.config.ts` imports `src/env.ts`, so a missing or malformed variable fails `next dev` / `next build` at startup. Every variable is listed in `.env.example` (committed); real values go in `.env.local` (gitignored). Add a new variable to all three: the schema, `experimental__runtimeEnv` for `NEXT_PUBLIC_*` ones, and `.env.example`.

## Auth

Clerk (`@clerk/nextjs`, Core 3) with custom screens; Clerk's prebuilt `<SignIn />`/`<SignUp />` aren't used.

- Methods: Google, GitHub, and email + password (sign-up verified by an emailed code). No organizations. Set in the Clerk Dashboard (or `clerk config patch` once the app is claimed).
- Screens (all in `src/app/(auth)/`, sharing the split layout: artwork `figure` on the left, hidden below `lg`; `Logo` + content on the right):
  - `/sign-in` → `src/components/auth/sign-in-form.tsx`: OAuth buttons, email + password, "Forgot password?" beside the password label, then an emailed code if Clerk asks to trust the device (`needs_client_trust` / `needs_second_factor` → `signIn.mfa`).
  - `/sign-up` → `sign-up-form.tsx`: OAuth buttons, email + password, then the email verification code.
  - `/forgot-password` → `forgot-password-form.tsx`: email → reset code → new password (`signIn.resetPasswordEmailCode`, other sessions signed out), then the same device check as sign-in.
  - Loading vs disabled: Clerk's `fetchStatus` is shared by everything using the same sign-in/sign-up (the OAuth buttons too), so it only **disables** controls. A submit button's **spinner** comes from `useSubmitting()` (`use-submitting.ts`): `submit(action)` spins only for the request that form started, and actions return `true` when they signed the user in so the spinner stays on while the page navigates. `OAuthButtons` spins only the pressed provider and disables the rest (and itself while an email form is busy).
  - Each screen is an `AuthStep` (`auth-step.tsx`: heading, form, and a centred footer linking to the other flow via `AuthLink`). Code inputs use `CodeField`; fields use `src/components/ui/form.tsx` with the signal hooks' `errors.fields.*`, `errors.global` and `fetchStatus`.
- OAuth: `OAuthButtons` (`oauth-buttons.tsx`) starts Google/GitHub with `signIn.sso()` from both screens (Clerk turns it into a sign-up for new accounts), landing on `/projects`. `sso()` silently does nothing (no redirect, no error) when an unfinished attempt is left over (an email sign-in or password reset abandoned halfway; Clerk keeps it across reloads), so `OAuthButtons` calls `signIn.reset()` first and runs `sso()` on the fresh attempt (`clerk.client.signIn.__internal_future`, since the hook's `signIn` is stale until the next render). Thrown errors and back-forward-cache restores reset the spinner. Brand icons live in `src/components/icons/` (one file each, wrapping `react-icons`): `GoogleIcon` is the colour "G" (`FcGoogle`), `GitHubIcon` the one-colour mark (`FaGithub`, follows the text colour as GitHub's brand asks). Add new brand icons there the same way. Providers return to `src/app/sso-callback/page.tsx` (`<HandleSSOCallback />`). `HandleSSOCallback` has no branch for a cancelled or failed provider (the attempt stays `needs_identifier` with `firstFactorVerification.error`, e.g. `oauth_access_denied`) and would spin forever. So the page watches for that error, keeps its message in memory (`setOAuthFailure`, `src/lib/auth.ts`), calls `signIn.reset()` (Clerk otherwise keeps the failed attempt across reloads), and returns to the screen that started it (`OAuthButtons` passes `?from=sign-in|sign-up`). `OAuthButtons` there shows the message once (`peekOAuthFailure`, cleared on mount), so a reload starts clean.
- Every finished flow calls `finalize({ navigate: navigateHome })` (`src/lib/auth.ts`), which lands on `/projects`.
- Access: `/` is public; `/sign-in`, `/sign-up`, `/forgot-password` and `/sso-callback` are for signed-out visitors only (`src/proxy.ts` redirects signed-in users to `/projects`); everything else is signed-in only. That last rule is enforced per resource, not in the proxy (Clerk deprecated `createRouteMatcher`): every page, layout, route handler and server action outside the public folders starts with `await auth.protect()` (from `@clerk/nextjs/server`). The `@clerk/next/require-auth-protection` lint rule (`oxlint.config.mts`) fails `bun run lint` when one doesn't; new public folders go in its `public` list.
- `ClerkProvider` (in `src/app/layout.tsx`) uses the shadcn theme from `@clerk/ui`, so `UserButton` and other Clerk widgets match the palette.

## API (oRPC)

The API is **oRPC v2** (`2.0.0-beta.43`, pinned) behind two Next.js route handlers. **Every procedure needs a signed-in Clerk user**; there are no public endpoints. All server code lives in `src/server/`; each feature is one folder in `src/server/modules/`.

```
src/
├── app/api/
│   ├── rpc/[[...rest]]/route.ts   # wiring: rpcHandler (typed client transport) at /api/rpc
│   └── [[...rest]]/route.ts       # wiring: openapiHandler (REST, /api/spec.json, /api/docs) at /api
├── lib/
│   ├── orpc.ts                    # `api` for Client Components: RPCLink to /api/rpc with batching
│   └── orpc.server.ts             # `api` for server code (RSC, Server Functions): in-process, request headers
└── server/
    ├── orpc.ts                    # Context type, protectedOS (the only procedure builder)
    ├── errors.ts                  # defineError(), ERROR_STATUSES, shared error classes
    ├── router.ts                  # root router { session }, AppRouter type
    ├── handlers.ts                # RPCHandler + OpenAPIHandler wiring (batch, CSRF, coercion, docs)
    ├── core/
    │   ├── require-auth.ts        # requireAuth: Clerk auth() → context.auth, else typed 401
    │   ├── declared-errors.ts     # declaredErrorsOnly middleware + declaredErrorsPlugin (undeclared → typed 500, bad decode → 400)
    │   ├── input-validation.ts    # inputValidation middleware (422 + prettified issues)
    │   └── openapi.ts             # OpenAPI generator, error body schemas, Clerk security schemes
    └── modules/<name>/
        ├── <name>.router.ts       # required: procedures
        ├── <name>.schemas.ts      # required: Zod input/output schemas + z.infer types (Zod-only imports)
        ├── <name>.errors.ts       # module error classes
        ├── <name>.service.ts      # optional: logic + DB, no oRPC imports
        └── <name>.constants.ts    # optional: CONST_CASE tunables; no `env` (schemas import it)
```

- **Procedure = one chain:** `protectedOS.meta(openapi({ method, path, summary, tags, successStatus? })).use(inputValidation).input(schema).output(schema).errors({...}).handler(({ context, input, errors }) => ...)`. Register it in the module's router object and the module in `server/router.ts`. `src/server/modules/session/` is the reference module (`GET /api/session` → the caller's Clerk `userId` and `sessionId`).
- **Auth:** `protectedOS` runs `requireAuth` (`core/require-auth.ts`), which calls Clerk's `auth()` and puts `{ userId, sessionId }` on `context.auth`; a signed-out or invalid request gets a typed `UNAUTHORIZED` (401). Clerk reads the `__session` cookie (browser) or an `Authorization: Bearer <session token>` header (`getToken()`; other clients), so both transports and the in-process server client behave the same. `clerkMiddleware` in `src/proxy.ts` must keep matching `/api` (its `config.matcher` does) for `auth()` to work there.
- **Guarding "every API is protected":** `baseOS` isn't exported, and lint bans importing `os` from `@orpc/server` outside `src/server/orpc.ts` and `src/server/core/` (`no-restricted-imports` in `oxlint.config.mts`), so a module can only build on `protectedOS`. `src/app/api/**` is in the Clerk rule's `public` list because its routes delegate to oRPC rather than calling `auth.protect()` (which would answer an untyped 404).
- **Errors are classes** made with `defineError(code, { message, data?, status? })` from `server/errors.ts` and thrown with `throw new X()`:
  - Standard HTTP codes (`BAD_REQUEST`, `NOT_FOUND`, `UNPROCESSABLE_CONTENT`, …) are only for the shared classes in `server/errors.ts`; they take their status from oRPC's `COMMON_ERROR_STATUS_MAP`.
  - **Module errors always use module-prefixed `SCREAMING_SNAKE` codes** (`RUNS_NOT_FOUND`) and declare a standard HTTP status next to them: `defineError("RUNS_NOT_FOUND", { status: 404, message, data? })`. A custom code without `status`, a lowercase code, a non-HTTP status (e.g. 418), or `status` on a standard code all fail to compile; reusing a custom code with a different status throws at startup.
  - `defineError` registers custom statuses in `ERROR_STATUSES`, which both handlers and the OpenAPI generator use. There is no hand-maintained status map.
  - Shared classes live in `server/errors.ts` (`BadRequest`, `InternalServerError`, `InputValidationFailed`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict`); module classes in `<name>.errors.ts`.
  - Declare every class a procedure throws: `.errors({ [RunsNotFound.code]: RunsNotFound })`.
  - Importing `error` or `ORPCError` from `@orpc/server` is lint-banned outside `server/errors.ts` and `server/core/`, so every error goes through `defineError`.
- **Guarantee: a matched procedure only ever returns errors it declares.**
  - Every procedure declares `BadRequest` (400), `InternalServerError` (500), `Unauthorized` (401) and `Forbidden` (403).
  - The `declaredErrorsOnly` middleware (procedure level, so in-process server calls too) and the `declaredErrorsPlugin` handler interceptor (decode + plugins) turn anything undeclared into a logged (`[orpc] <path> failed`), typed `InternalServerError`.
  - Malformed bodies/queries (failed decoding) become a typed `BadRequest`.
  - `.use(inputValidation)` before `.input(schema)` adds 422 `InputValidationFailed` (code `UNPROCESSABLE_CONTENT`, `z.prettifyError` message + `data.issues`) only to endpoints with input.
  - `Forbidden` comes from `GetMethodCsrfProtectionHandlerPlugin` (Clerk's cookie is `SameSite=Lax`, so it blocks cross-site GET navigations); it's listed before `declaredErrorsPlugin` in `handlers.ts` so the boundary wraps it and the 403 stays typed.
  - Unknown routes return `{ defined: false, code: "NOT_FOUND" }` from the route handlers (no procedure to declare against).
- **Clients:**
  - Client Components: `import { api } from "@/lib/orpc"` (batched over `/api/rpc`). It throws if it ever runs on the server.
  - Server Components, Server Functions, route handlers: `import { api } from "@/lib/orpc.server"` (`server-only`). It skips HTTP but runs the same middleware chain, Clerk `auth()` included.
  - Handle errors with `safe(...)` from `@orpc/client` + `isDefinedError(error) && error.code === "RUNS_NOT_FOUND"` for typed `error.data`.
- **Client-importable server files:** only `src/server/**/*.schemas.ts` and `*.errors.ts` (and `server/errors.ts`). `server/orpc.ts`, `server/handlers.ts` and `lib/orpc.server.ts` import `server-only`, so pulling them into a Client Component fails the build.
- **Docs** (non-production): `/api/docs` (Scalar), `/api/spec.json` (OpenAPI), generated from the router. The docs page itself is public; calls made from it still need a session.

## App pages and client data

- **Signed-in pages** live in `src/app/(app)/`. Its `layout.tsx` (header with `Logo` + `UserButton`, centred column) calls `await auth.protect()` first, so it is request-bound and exports `instant = false` (Cache Components would otherwise require that read inside `<Suspense>`); each page streams its data behind its own `loading.tsx`. Pages call `await auth.protect()` too (Clerk lint rule).
- **Data:** TanStack Query + `@orpc/tanstack-query`. `orpc` (from `@/lib/orpc` in Client Components, `@/lib/orpc.server` in Server Components) gives `queryOptions()`, `mutationOptions()`, `queryKey()`; never hand-write query keys. `makeQueryClient()` (`src/lib/query-client.ts`) sets the defaults: typed API errors (`isDefinedError`) aren't retried, 30 s `staleTime`, pending queries dehydrate. `Providers` (`src/components/providers.tsx`) holds one browser client per tab plus the `Toaster`.
- **Page pattern** (`src/app/(app)/projects/page.tsx`): `await auth.protect()` → `const queryClient = makeQueryClient()` → `await queryClient.query(orpc.x.queryOptions())` (server `orpc`) → `<HydrationBoundary state={dehydrate(queryClient)}>` around a Client Component that reads the same query with `useSuspenseQuery`. No loading flash, no double fetch.
- **Mutations update the cache from the server's response, not optimistically** (reference: `src/components/projects/use-project-mutations.ts`). `onSuccess` writes the returned row into the list with `setQueryData` (no refetch), then `invalidateQueries({ queryKey, refetchType: "none" })` marks the list stale so the next mount or window focus re-syncs it. Meanwhile the UI shows a pending state: the dialog stays open, its submit `Button` gets `isLoading`, fields go `isReadOnly`, Cancel/close and outside/Escape dismissal are blocked; errors render inside the dialog (`FormAlert` / `Alert` with `errorMessage()` from `src/lib/errors.ts`), which stays open. Treat `isPending || isSuccess` as busy: the dialog closes from the mutate-level `onSuccess`, one render after the mutation stops pending. Never reset a dialog's form or mutation on close (it would flash idle while the dialog animates out): reset on open, or remount per open with a `key`.
- **Dialogs opened from a menu** are controlled (`isOpen`/`onOpenChange` on `Dialog`/`AlertDialog`, no trigger) and own their mutation; the parent remounts them on each open (`key` bumped in `onAction`, see `ProjectCard`) so every opening starts with a fresh form and mutation. Free-text name inputs set `autoComplete="off"`: browser autofill otherwise previews suggestions in the field and swallows the first Escape.
- **Busy controls keep focus:** `Button`'s `isLoading` is React Aria's `isPending` (presses ignored, still focusable), not `isDisabled`, and dialog fields use `isReadOnly` while saving. A disabled focused element drops focus to `<body>`, outside the dialog, and Escape stops reaching it.
- **Forms in dialogs** validate with the module's Zod input schema (`createProjectInputSchema.safeParse`) before mutating, so client and server share one rule set.
- **UI pieces** (all in `src/components/ui/`, React Aria where interactive): `Dialog` (+ `DialogTrigger`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`), `AlertDialog` (confirmations: no close button, no outside dismiss; `AlertDialogMedia variant="destructive"` for deletes), `DropdownMenu` (+ `DropdownMenuTrigger`, `DropdownMenuItem variant="destructive"`, `DropdownMenuSeparator`; opens on press, `onAction` gets the item `id`), `Empty` (shadcn's empty state restyled: dashed card, cobalt icon tile, heading font), `Skeleton` (shape is owned by the component; size it with `h-*`/`w-*` only), `Toaster` (sonner, follows `next-themes`; mounted in `Providers` for transient notices), `ThemeToggle` (`src/components/theme-toggle.tsx`, in the app and landing headers: flips light/dark, follows the OS until used). Dates relative to now (`formatRelativeTime`, `src/lib/format.ts`) render in a `<time suppressHydrationWarning>`.

## Database

Postgres 18 via **Drizzle** (`drizzle-orm/postgres-js`). Locally it runs in Docker (`compose.yaml`, image `postgres:18.2-alpine3.23`, localhost:5432); the URL in `.env.example` points at it. Schema in `src/server/db/schema.ts`, client in `src/server/db/client.ts` (`db`, `server-only`; only server modules' `*.service.ts` import it). Migrations are generated into `drizzle/` and committed; never edit a generated migration, change the schema and generate a new one. Product context for the tables: `docs/plan.md` §5.

- Tables: `projects` → `workflows` (`graph` jsonb: `WorkflowGraph`) → `runs` (`id` is the Trigger.dev run id; `status` is the `run_status` enum; `steps` jsonb: `RunStep[]`, written when the run ends). Deleting a project cascades to its workflows and their runs.
- Every table has `user_id` (the Clerk user id). Every query filters by it (`context.auth.userId`), and a row owned by someone else is treated as not found.
- At most one active run (`queued`, `running`, `waiting`) per workflow, enforced by the partial unique index `runs_one_active_per_workflow_idx`; map its violation to the module's `CONFLICT`-status error.
- `updated_at` columns update themselves on Drizzle updates (`$onUpdate`); timestamps are `timestamptz`.
- Columns stay in table order (lint's `sort-keys` is off for the schema file only).
- Derive row types from the schema (`Project`, `Workflow`, `Run`, or `typeof table.$inferSelect` / `$inferInsert`); narrow with `Pick`/`Omit` rather than redeclaring shapes. Don't add an insert type where `db.insert(...).values()` already enforces the shape.
- Use `db.select()/insert()/update()/delete()`, never `db.query.*`.

## Browserbase observability

Session recordings, replays, live view, and logs come from the core Browserbase SDK (`@browserbasehq/sdk`) — not Stagehand. Before building any observability feature, consult Browserbase's observability docs: https://docs.browserbase.com/platform/browser/observability

Session replay specifically — retrieving a session's recording as an HLS playlist — is documented here: https://docs.browserbase.com/platform/browser/observability/session-replay The retrieval needs the secret API key, so it must be proxied server-side. The same goes for the live view URL used for human takeover.

<!-- TRIGGER.DEV SKILLS START -->

## Trigger.dev agent skills

This project has Trigger.dev agent skills installed in `.agents/skills/`. Before writing or changing Trigger.dev code (background tasks, scheduled tasks, realtime, or chat.agent AI agents), load the most relevant skill: `trigger-authoring-chat-agent`, `trigger-authoring-tasks`, `trigger-chat-agent-advanced`, `trigger-cost-savings`, `trigger-getting-started`, `trigger-realtime-and-frontend`.

<!-- TRIGGER.DEV SKILLS END -->

# Stagehand Project

This is a project that uses Stagehand V3, a browser automation framework with AI-powered `act`, `extract`, `observe`, and `agent` methods.

The main class can be imported as `Stagehand` from `@browserbasehq/stagehand`.

**Key Classes:**

- `Stagehand`: Main orchestrator class providing `act`, `extract`, `observe`, and `agent` methods
- `context`: A `V3Context` object that manages browser contexts and pages
- `page`: Individual page objects accessed via `stagehand.context.pages()[i]` or created with `stagehand.context.newPage()`

## Initialize

```typescript
import { Stagehand } from "@browserbasehq/stagehand";

const stagehand = new Stagehand({
  env: "LOCAL", // or "BROWSERBASE"
  verbose: 2, // 0, 1, or 2
  model: "openai/gpt-4.1-mini", // or any supported model
});

await stagehand.init();

// Access the browser context and pages
const page = stagehand.context.pages()[0];
const context = stagehand.context;

// Create new pages if needed
const page2 = await stagehand.context.newPage();
```

## Act

Actions are called on the `stagehand` instance (not the page). Use atomic, specific instructions:

```typescript
// Act on the current active page
await stagehand.act("click the sign in button");

// Act on a specific page (when you need to target a page that isn't currently active)
await stagehand.act("click the sign in button", { page: page2 });
```

**Important:** Act instructions should be atomic and specific:

- ✅ Good: "Click the sign in button" or "Type 'hello' into the search input"
- ❌ Bad: "Order me pizza" or "Type in the search bar and hit enter" (multi-step)

### Observe + Act Pattern (Recommended)

Cache the results of `observe` to avoid unexpected DOM changes:

```typescript
const instruction = "Click the sign in button";

// Get candidate actions
const actions = await stagehand.observe(instruction);

// Execute the first action
await stagehand.act(actions[0]);
```

To target a specific page:

```typescript
const actions = await stagehand.observe("select blue as the favorite color", {
  page: page2,
});
await stagehand.act(actions[0], { page: page2 });
```

## Extract

Extract data from pages using natural language instructions. The `extract` method is called on the `stagehand` instance.

### Basic Extraction (with schema)

```typescript
import { z } from "zod";

// Extract with explicit schema
const data = await stagehand.extract(
  "extract all apartment listings with prices and addresses",
  z.object({
    listings: z.array(
      z.object({
        price: z.string(),
        address: z.string(),
      })
    ),
  })
);

console.log(data.listings);
```

### Simple Extraction (without schema)

```typescript
// Extract returns a default object with 'extraction' field
const result = await stagehand.extract("extract the sign in button text");

console.log(result);
// Output: { extraction: "Sign in" }

// Or destructure directly
const { extraction } = await stagehand.extract(
  "extract the sign in button text"
);
console.log(extraction); // "Sign in"
```

### Targeted Extraction

Extract data from a specific element using a selector:

```typescript
const reason = await stagehand.extract(
  "extract the reason why script injection fails",
  z.string(),
  { selector: "/html/body/div[2]/div[3]/iframe/html/body/p[2]" }
);
```

### URL Extraction

When extracting links or URLs, use `z.string().url()`:

```typescript
const { links } = await stagehand.extract(
  "extract all navigation links",
  z.object({
    links: z.array(z.string().url()),
  })
);
```

### Extracting from a Specific Page

```typescript
// Extract from a specific page (when you need to target a page that isn't currently active)
const data = await stagehand.extract(
  "extract the placeholder text on the name field",
  { page: page2 }
);
```

## Observe

Plan actions before executing them. Returns an array of candidate actions:

```typescript
// Get candidate actions on the current active page
const [action] = await stagehand.observe("Click the sign in button");

// Execute the action
await stagehand.act(action);
```

Observing on a specific page:

```typescript
// Target a specific page (when you need to target a page that isn't currently active)
const actions = await stagehand.observe("find the next page button", {
  page: page2,
});
await stagehand.act(actions[0], { page: page2 });
```

## Agent

Use the `agent` method to autonomously execute complex, multi-step tasks.

### Basic Agent Usage

```typescript
const page = stagehand.context.pages()[0];
await page.goto("https://www.google.com");

const agent = stagehand.agent({
  model: "google/gemini-2.0-flash",
  executionModel: "google/gemini-2.0-flash",
});

const result = await agent.execute({
  instruction: "Search for the stock price of NVDA",
  maxSteps: 20,
});

console.log(result.message);
```

### Computer Use Agent (CUA)

For more advanced scenarios using computer-use models:

```typescript
const agent = stagehand.agent({
  mode: "cua", // Enable Computer Use Agent mode
  model: "anthropic/claude-sonnet-4-6",
  // or "google/gemini-2.5-computer-use-preview-10-2025"
  systemPrompt: `You are a helpful assistant that can use a web browser.
    Do not ask follow up questions, the user will trust your judgement.`,
});

await agent.execute({
  instruction: "Apply for a library card at the San Francisco Public Library",
  maxSteps: 30,
});
```

### Agent with Custom Model Configuration

```typescript
const agent = stagehand.agent({
  mode: "cua",
  model: {
    modelName: "google/gemini-2.5-computer-use-preview-10-2025",
    apiKey: process.env.GEMINI_API_KEY,
  },
  systemPrompt: `You are a helpful assistant.`,
});
```

### Agent with Integrations (MCP/External Tools)

```typescript
const agent = stagehand.agent({
  integrations: [`https://mcp.exa.ai/mcp?exaApiKey=${process.env.EXA_API_KEY}`],
  systemPrompt: `You have access to the Exa search tool.`,
});
```

## Advanced Features

### DeepLocator (XPath Targeting)

Target specific elements across shadow DOM and iframes:

```typescript
await page
  .deepLocator("/html/body/div[2]/div[3]/iframe/html/body/p")
  .highlight({
    durationMs: 5000,
    contentColor: { r: 255, g: 0, b: 0 },
  });
```

### Multi-Page Workflows

```typescript
const page1 = stagehand.context.pages()[0];
await page1.goto("https://example.com");

const page2 = await stagehand.context.newPage();
await page2.goto("https://example2.com");

// Act/extract/observe operate on the current active page by default
// Pass { page } option to target a specific page
await stagehand.act("click button", { page: page1 });
await stagehand.extract("get title", { page: page2 });
```
