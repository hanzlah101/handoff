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
  - Each screen is an `AuthStep` (`auth-step.tsx`: heading, form, and a centred footer linking to the other flow via `AuthLink`). Code inputs use `CodeField`; fields use `src/components/ui/form.tsx` with the signal hooks' `errors.fields.*`, `errors.global` and `fetchStatus`.
- OAuth: `OAuthButtons` (`oauth-buttons.tsx`) starts Google/GitHub with `signIn.sso()` from both screens (Clerk turns it into a sign-up for new accounts). Brand icons live in `src/components/icons/` (one file each, wrapping `react-icons`): `GoogleIcon` is the colour "G" (`FcGoogle`), `GitHubIcon` the one-colour mark (`FaGithub`, follows the text colour as GitHub's brand asks). Add new brand icons there the same way. Providers return to `src/app/sso-callback/page.tsx` (`<HandleSSOCallback />`); a failed return goes back to `/sign-in` or `/sign-up`, whose form shows the error from `errors.global`.
- Every finished flow calls `finalize({ navigate: navigateHome })` (`src/lib/auth.ts`).
- Access: `/` is public; `/sign-in`, `/sign-up`, `/forgot-password` and `/sso-callback` are for signed-out visitors only (`src/proxy.ts` redirects signed-in users to `/`); everything else is signed-in only. That last rule is enforced per resource, not in the proxy (Clerk deprecated `createRouteMatcher`): every page, layout, route handler and server action outside the public folders starts with `await auth.protect()` (from `@clerk/nextjs/server`). The `@clerk/next/require-auth-protection` lint rule (`oxlint.config.mts`) fails `bun run lint` when one doesn't; new public folders go in its `public` list.
- `ClerkProvider` (in `src/app/layout.tsx`) uses the shadcn theme from `@clerk/ui`, so `UserButton` and other Clerk widgets match the palette.

## Database types

Derive database types from the Drizzle schema — never hand-write custom or partial shapes for table rows. Export `typeof table.$inferSelect` (and `$inferInsert` when needed) from the schema file and import it. When a consumer needs only some columns, narrow with `Pick<Row, ...>` / `Omit<Row, ...>` rather than redeclaring a literal type. Don't add an insert type where `db.insert(...).values()` already enforces the shape. Use `db.select()/insert()/update()/delete()`, never `db.query.*`.

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
