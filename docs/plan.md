# Handoff: Product & Technical Plan

Status: draft for review · Last updated: 2026-10-17 · Deadline: 2026-10-17, 12:45 PM PKT (submission)

Handoff runs browser automations that know when to ask a human. You build a workflow on a canvas (open a page, click, extract, let an agent drive), run it in a cloud browser, and watch it live. When the agent hits something it shouldn't or can't handle alone (a login, a captcha, a 2FA prompt, a step that fails), the run **pauses instead of failing**, shows you the live browser, you fix it, click **Hand back**, and the agent carries on from the same page.

Theme fit (Human + AI: Better Together): the handoff is the product, not a feature bolted on. The AI does the repetitive driving; the human does the judgment calls and the things only a human may do.

---

## 1. Goals and non-goals

### Goals

1. A signed-in user organises work into **projects**; each project holds **workflows**.
2. A workflow is a graph of steps edited on a canvas and saved automatically.
3. Running a workflow drives a real cloud browser; every step's status and output is visible live.
4. **Human handoff:** a blocked or failed browser step pauses the run, shows the live browser, and resumes on "Hand back". Only a step that is still blocked after the human's help fails the run.
5. Every mutation shows a clear pending state and updates the screen from the server's response (no refetch); errors stay visible where the action was taken.
6. Deployed on Alternate Clouds and reliable for a 6-minute live demo.

### Non-goals (for now)

- **Organizations**, teams, invites, roles. Everything belongs to one user (`userId` from Clerk).
- Billing and plan gating (every node is available to everyone).
- Real-time multiplayer editing and cursors.
- Scheduled or webhook-triggered runs.
- Session replay of finished runs (stretch, §12).
- Mobile layout for the editor (sign-in and project list stay responsive).

---

## 2. Core experience

### 2.1 Screens

| Route | What | Notes |
| --- | --- | --- |
| `/` | Landing: logo, pitch, sign in / sign up | Public |
| `/sign-in`, `/sign-up`, `/forgot-password` | Auth (done) | Signed-out only |
| `/projects` | Project list: create, rename, delete | Signed-in; the home after sign-in |
| `/projects/[projectId]` | Workflow list of one project: create, rename, delete | Signed-in, owner only |
| `/projects/[projectId]/workflows/[workflowId]` | Editor: canvas, inspector, run console | Signed-in, owner only |

After sign-in, `navigateHome` goes to `/projects` instead of `/`.

### 2.2 Projects

- Fields: name (1–60 characters, trimmed). Names need not be unique.
- Ordered by last updated (a workflow save touches its project).
- Deleting a project deletes its workflows and their run history (confirmation dialog states the counts).
- A new user gets one project, "My first project", created on first visit to `/projects` (idempotent: only when the user has none).

### 2.3 Workflows

- Fields: name (1–80), `graph` (nodes + edges, JSON), owning project.
- New workflow: generated name ("Untitled workflow 3"), a graph with only the Start node.
- Editor layout: canvas (top-left), run console (bottom-left, resizable), inspector (right, resizable).
- **Autosave:** graph changes are debounced (800 ms) and sent with `workflows.saveGraph`; the toolbar shows Saving… / Saved / Couldn't save (retry); see §8.
- Validation before a run (server-side, same function the client uses for hints): exactly one Start node, no cycles, every connected node has its required fields, every `{{ nodeId.path }}` reference points to an upstream node.

### 2.4 Nodes

| Node | Fields | Output | Notes |
| --- | --- | --- | --- |
| Start | – | – | Entry point, exactly one |
| Open URL | url | url, title | Opens the run's browser session on first use |
| Act | instruction | success, message, url | One atomic action ("Click Sign in") |
| Extract | instruction | extraction | Pulls data from the page |
| Observe | instruction | matches | Finds elements without acting |
| Agent | instruction | success, message, completed | Multi-step autonomous task |
| Ask human | message | approved, note | **New.** Always pauses the run for a human decision (approve / reject + note); see §3.3 |
| Send email | to, subject, body | id | Resend |

Fields can reference upstream outputs with `{{ nodeId.path }}`, interpolated just before the node runs. Adding a node = executor file + executor registry entry + manifest entry (kind, label, icon, fields, outputs); the run task and canvas are registry-driven.

### 2.5 Running

1. **Run** saves pending graph changes, then calls `runs.start`.
2. The server validates the graph, creates a `runs` row, triggers the Trigger.dev task, and returns `{ runId, publicAccessToken }` (a token scoped to that one run).
3. The editor subscribes to the run (Trigger.dev realtime) and renders each step's status on its canvas node and in the console: pending → running → done | failed | **needs human**.
4. **Stop** cancels the run (`runs.cancel`). One live run per workflow (409 otherwise).

---

## 3. Human handoff (the core feature)

### 3.1 When a run pauses

| Trigger | Detected by |
| --- | --- |
| A browser step throws, or returns `success: false` | Executor result |
| The page shows a login wall, captcha or 2FA prompt (checked after Open URL and after any failed step) | One `extract` call with a fixed schema: `{ blocked: boolean, reason: "login" \| "captcha" \| "two_factor" \| "other", detail: string }` |
| An **Ask human** node | Always |

Browserbase solves some captchas automatically; the check only pauses when one is still on screen.

### 3.2 What happens

1. The step's status becomes `needs_human` with `reason` and `detail`; the run publishes the Browserbase **live view URL** (from `sessions.debug(sessionId)`, fetched server-side, never exposing the API key) and a Trigger.dev wait token id in its metadata.
2. The console shows a **Your turn** panel: the reason ("Login required on github.com"), the live browser in an iframe you can click and type in, and **Hand back to agent** (plus **Stop run**).
3. While paused, the task waits **without suspending the process** (it polls the wait token every 2 s with a plain timer) so the browser connection stays open. Timeout: 10 minutes, then the step fails with "No one took over in time".
4. **Hand back** calls `runs.resume({ runId })`. The server checks the run belongs to the caller and is waiting, then completes the token.
5. The task re-runs the blocked step once. Still blocked → the step fails and the run stops (no automatic retries of the whole run: `retries.maxAttempts` is 1 for this task, so a login wall isn't hit three times).

### 3.3 Ask human node

Same pause, different panel: shows the node's message plus the latest page in the live view, with **Approve** / **Reject** and an optional note. Output `{ approved, note }` lets later nodes branch on the decision (e.g. only submit the form when approved). This is the "AI fills it, a human checks it before it's sent" demo.

### 3.4 Risks

| Risk | Mitigation |
| --- | --- |
| Live view iframe blocked by the browser or CSP | Open in new tab fallback button |
| `wait.retrieveToken` not available in the installed Trigger.dev version | Poll a `runs.handed_back_at` column instead (same loop) |
| Detection false positives | Detection only runs after a failure or after Open URL; the human can hand back immediately |

---

## 4. Architecture

```
Browser ── Next.js app (Alternate Clouds) ──┬── Postgres (Drizzle)
   │        ├─ pages (RSC + client)         ├── Clerk (auth)
   │        └─ /api/rpc, /api (oRPC)  ──────┼── Trigger.dev (run task, realtime, wait tokens)
   └── Trigger.dev realtime (run status)    └── Browserbase + Stagehand (cloud browser, live view)
```

- **Web app:** Next.js 16 (App Router, Cache Components, typed routes), deployed as a Docker image on Alternate Clouds (`output: "standalone"`).
- **API:** oRPC (done): every procedure is `protectedOS`, typed errors, OpenAPI docs in development.
- **Background runs:** Trigger.dev task `run-workflow`; one Browserbase session per run (opened on the first browser step, closed at the end, including on failure and cancel).
- **Realtime:** Trigger.dev run metadata (`steps`, `handoff`) streamed to the editor with a per-run public token.
- **Email:** Resend.
- **Hosting caveat:** the run task executes on Trigger.dev's cloud and browsers on Browserbase. Confirm with the organizers that this counts as "deployed on Alternate Clouds" (the app, API and database client are hosted there).

---

## 5. Data model (Postgres, Drizzle)

Every table carries `user_id` (Clerk user id) so each query filters by owner directly. Types derive from the schema (`$inferSelect`).

```
projects
  id          uuid pk default random
  user_id     text not null            -- index
  name        text not null
  created_at  timestamptz default now
  updated_at  timestamptz default now

workflows
  id          uuid pk default random
  project_id  uuid not null → projects.id on delete cascade   -- index
  user_id     text not null            -- index
  name        text not null
  graph       jsonb not null           -- { nodes, edges }
  created_at  timestamptz default now
  updated_at  timestamptz default now

runs
  id                      text pk      -- Trigger.dev run id
  workflow_id             uuid not null → workflows.id on delete cascade   -- index
  user_id                 text not null
  status                  text not null   -- queued | running | waiting | completed | failed | cancelled
  steps                   jsonb           -- final step list, written when the run ends
  browserbase_session_id  text
  error                   text
  created_at              timestamptz default now
  finished_at             timestamptz
```

- One live run per workflow: partial unique index on `runs(workflow_id) where status in ('queued','running','waiting')`.
- `workflows.saveGraph` also bumps `projects.updated_at` in the same transaction.
- Only `db.select() / insert() / update() / delete()`; migrations committed in `drizzle/`.

---

## 6. API (oRPC procedures)

All procedures are signed-in only and scope every query by `context.auth.userId`; another user's id answers the module's `*_NOT_FOUND` (never 403, so ids don't leak). Each module: `router`, `schemas`, `errors`, `service`.

| Procedure | REST | Input → Output | Errors |
| --- | --- | --- | --- |
| `projects.list` | GET /projects | – → Project[] |  |
| `projects.create` | POST /projects (201) | { id?, name } → Project |  |
| `projects.rename` | PATCH /projects/{id} | { id, name } → Project | PROJECTS_NOT_FOUND 404 |
| `projects.remove` | DELETE /projects/{id} (204) | { id } | PROJECTS_NOT_FOUND 404 |
| `workflows.list` | GET /projects/{projectId}/workflows | { projectId } → WorkflowSummary[] | PROJECTS_NOT_FOUND 404 |
| `workflows.get` | GET /workflows/{id} | { id } → Workflow | WORKFLOWS_NOT_FOUND 404 |
| `workflows.create` | POST /projects/{projectId}/workflows (201) | { id?, projectId, name } → Workflow | PROJECTS_NOT_FOUND 404 |
| `workflows.rename` | PATCH /workflows/{id} | { id, name } → WorkflowSummary | WORKFLOWS_NOT_FOUND 404 |
| `workflows.saveGraph` | PUT /workflows/{id}/graph | { id, graph } → { updatedAt } | WORKFLOWS_NOT_FOUND 404 |
| `workflows.remove` | DELETE /workflows/{id} (204) | { id } | WORKFLOWS_NOT_FOUND 404 |
| `runs.start` | POST /workflows/{id}/runs (201) | { workflowId } → { runId, publicAccessToken } | WORKFLOWS_NOT_FOUND 404, WORKFLOWS_INVALID_GRAPH 422 (data: problems[]), RUNS_ALREADY_ACTIVE 409 |
| `runs.list` | GET /workflows/{id}/runs | { workflowId } → RunSummary[] (latest 20) | WORKFLOWS_NOT_FOUND 404 |
| `runs.subscribe` | POST /runs/{id}/subscription | { runId } → { publicAccessToken } | RUNS_NOT_FOUND 404 |
| `runs.cancel` | POST /runs/{id}/cancel (204) | { runId } | RUNS_NOT_FOUND 404, RUNS_NOT_ACTIVE 409 |
| `runs.liveView` | GET /runs/{id}/live-view | { runId } → { url } | RUNS_NOT_FOUND 404, RUNS_NOT_WAITING 409 |
| `runs.resume` | POST /runs/{id}/resume (204) | { runId, approved?, note? } | RUNS_NOT_FOUND 404, RUNS_NOT_WAITING 409 |

- `create` accepts an optional client-generated `id` (uuid) so a retried create is idempotent (same id returns the same row). A duplicate id from another user answers `CONFLICT`.
- `graph` is validated with a Zod schema (node types from the registry, string field values, edges referencing existing nodes); semantic checks (cycles, required fields) run at `runs.start` and return `WORKFLOWS_INVALID_GRAPH` with every problem so the editor can mark the nodes.
- The run task never trusts the client: it reloads the graph from the database by `workflowId` + `userId`.

---

## 7. Client data layer

- **TanStack Query** with **`@orpc/tanstack-query`**: `orpc.projects.list.queryOptions()`, `orpc.projects.create.mutationOptions(...)`; query keys come from the same utils (`orpc.projects.list.queryKey()`), never hand-written.
- Server Components prefetch the first screen with the in-process client (`@/lib/orpc.server`) into a request-scoped `QueryClient`, then `HydrationBoundary`; client components read the same queries without a loading flash.
- Errors: `isDefinedError(error)` + `error.code` for typed handling; anything else shows "Something went wrong." with a retry.
- `QueryClient` defaults: no retry on 4xx, `staleTime` 30 s, refetch on window focus for lists.

---

## 8. Mutation updates

Decision (changed from optimistic updates): mutations show a pending state and update the cache from the server's response.

1. While the request runs, the dialog stays open with a spinner on its action; it can't be dismissed.
2. `onSuccess`: write the returned row into the cached list with `setQueryData` (no refetch), then mark the list stale (`invalidateQueries` with `refetchType: "none"`) so the next mount or focus re-syncs.
3. On error: the dialog stays open and shows the typed error's message; nothing in the list changed.

| Mutation | On success |
| --- | --- |
| Create project / workflow | Insert the returned row at the top of its list; close the dialog |
| Rename project / workflow | Replace the row with the returned one (moves to the top: fresh `updatedAt`) |
| Delete project / workflow | Remove the row |
| Save graph (autosave) | Patch the cached workflow's `updatedAt`; the canvas stays the source of truth ("Saving…" → "Saved", "Couldn't save" + retry on error) |
| Start run / Hand back / Stop | Reflect the returned run state; the realtime subscription takes over |

---

## 9. Run task design

- Loads the workflow (`workflowId`, `userId`), topologically sorts connected nodes (cycle → fails before opening a browser).
- Publishes `steps` (all `pending`) at start; flushes metadata when a step starts so the canvas shows it spinning.
- Executors receive interpolated field values and a lazy `getStagehand()`.
- On a handoff (§3): publishes `handoff: { stepId, reason, detail, tokenId }`, sets `runs.status = waiting`, polls, clears `handoff` and resumes.
- Always closes the Browserbase session (finally), writes `steps`, `status`, `finished_at` and `error` to `runs`.
- Cancel: `runs.cancel` cancels the Trigger.dev run; the task's cleanup closes the browser.
- Model: Stagehand through Browserbase's model gateway (no separate LLM key).

---

## 10. Security

- Every procedure filters by `userId`; ids of other users' rows answer `NOT_FOUND`.
- Public access tokens are minted per run, read-only, short-lived, and only after an ownership check.
- The Browserbase key stays server-side; the live view URL is only returned to the run's owner while it is waiting.
- `runs.resume` checks ownership and `waiting` status before completing the token, so nobody else can resume or approve a run.
- Secrets only in env (validated in `src/env.ts`), never in the repo, video or screenshots.
- Clerk lint rule keeps every page outside the public folders behind `auth.protect()`; oRPC lint keeps every procedure on `protectedOS`.

---

## 11. Failure behaviour

| Situation | What the user sees |
| --- | --- |
| Save fails | "Couldn't save" + retry; canvas keeps the edits |
| Invalid graph on Run | Problem list in the console, offending nodes outlined red |
| Browser step fails, page not blocked | Run pauses (§3) with the step error as the reason |
| Nobody hands back in 10 min | Step fails "No one took over in time", browser closed |
| Trigger.dev or Browserbase down | `runs.start` returns a typed 503 (`RUNS_UNAVAILABLE`); toast "Runs are unavailable right now" |
| Run crashes mid-way | Last flushed step shows `failed` with its error; `runs` row marked failed |
| Signed out mid-session | Next API call answers 401; client redirects to `/sign-in` |

---

## 12. Milestones (until 12:45 PM)

| By | Milestone | Done when |
| --- | --- | --- |
| 03:30 | **Deploy first** | Dockerfile (standalone), Postgres provisioned, app live on Alternate Clouds with sign-in working; hosting caveat (§4) confirmed with organizers |
| 05:00 | Projects + workflows | Schema + migrations, `projects.*` / `workflows.*`, TanStack Query mutations that update the cache from responses, `/projects` and `/projects/[id]` |
| 07:00 | Editor + runs | Canvas, inspector, autosave, node registry and executors, `run-workflow` task, live step status in console |
| 09:00 | **Human handoff** | Detection, `needs_human` step, live view panel, Hand back, Ask human node, timeout |
| 10:00 | Demo flow + polish | A public demo site flow: open page → hit login → hand off → extract → Ask human → send email; error states checked |
| 11:00 | Redeploy + record | Final deploy, 2–3 min demo video, proof screenshots (Discord, Alternate Clouds dashboard) |
| 12:15 | Submit | Submission PDF (team, project, links, test login, confirmations); LinkedIn post **written by the team**, reshared |

Stretch (only if ahead): session replay of finished runs, run history page, a "Request approval" email from the Ask human node.

---

## 13. Demo script (6 minutes)

1. Problem (30 s): agents get stuck on logins and shouldn't submit things unchecked.
2. Build (1 min): new project → workflow: Open URL → Agent "fill the form" → Ask human "Submit this?" → Act "submit" → Send email.
3. Run (2.5 min): agent drives; login wall → run pauses → log in through the live view → Hand back → agent fills the form → Ask human → approve → submitted → email arrives.
4. Reliability (1 min): reject path, stop mid-run, offline save retry.
5. Close (1 min): theme, stack, Alternate Clouds deployment.

---

## 14. Open questions

1. Does the organizers' "deployed on Alternate Clouds" accept Trigger.dev and Browserbase as external services? (Blocks §4; ask first.)
2. Postgres: hosted on Alternate Clouds or an external provider (Neon)?
3. Which public site for the login demo is reliable and allowed (a dedicated test login page)?
4. Is `wait.retrieveToken` in the installed Trigger.dev version, or do we poll a database column (§3.4)?
