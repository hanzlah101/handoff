import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Every table carries the owner's Clerk user id, so each query filters by
// owner directly (no joins up to the project).

// The canvas graph as saved: React Flow's nodes and edges, trimmed to what
// the run task reads.
export type WorkflowNode = {
  id: string;
  type: "step";
  position: { x: number; y: number };
  data: {
    // Key into the node registry ("open-url", "act", …).
    type: string;
    title: string;
    values: Record<string, string>;
  };
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
};

export type WorkflowGraph = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type RunStepStatus =
  | "pending"
  | "running"
  | "needs_human"
  | "done"
  | "failed";

// One node's outcome in a finished run (live progress streams through the
// run's metadata; this is the copy kept afterwards).
export type RunStep = {
  nodeId: string;
  type: string;
  title: string;
  status: RunStepStatus;
  durationMs?: number;
  output?: unknown;
  error?: string;
};

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Also bumped when one of the project's workflows is saved.
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("projects_user_id_updated_at_idx").on(table.userId, table.updatedAt),
  ]
);

export const workflows = pgTable(
  "workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    graph: jsonb("graph").$type<WorkflowGraph>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("workflows_project_id_updated_at_idx").on(
      table.projectId,
      table.updatedAt
    ),
    index("workflows_user_id_idx").on(table.userId),
  ]
);

export const runStatus = pgEnum("run_status", [
  "queued",
  "running",
  "waiting",
  "completed",
  "failed",
  "cancelled",
]);

export const runs = pgTable(
  "runs",
  {
    // The Trigger.dev run id.
    id: text("id").primaryKey(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    status: runStatus("status").notNull().default("queued"),
    // Written when the run ends.
    steps: jsonb("steps").$type<RunStep[]>(),
    browserbaseSessionId: text("browserbase_session_id"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [
    index("runs_workflow_id_created_at_idx").on(
      table.workflowId,
      table.createdAt
    ),
    index("runs_user_id_idx").on(table.userId),
    // At most one live run per workflow.
    uniqueIndex("runs_one_active_per_workflow_idx")
      .on(table.workflowId)
      .where(sql`${table.status} in ('queued', 'running', 'waiting')`),
  ]
);

export type Project = typeof projects.$inferSelect;
export type Workflow = typeof workflows.$inferSelect;
export type Run = typeof runs.$inferSelect;
export type RunStatus = (typeof runStatus.enumValues)[number];
