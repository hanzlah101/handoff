CREATE TYPE "public"."run_status" AS ENUM('queued', 'running', 'waiting', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "runs" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" "run_status" DEFAULT 'queued' NOT NULL,
	"steps" jsonb,
	"browserbase_session_id" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"graph" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_user_id_updated_at_idx" ON "projects" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "runs_workflow_id_created_at_idx" ON "runs" USING btree ("workflow_id","created_at");--> statement-breakpoint
CREATE INDEX "runs_user_id_idx" ON "runs" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "runs_one_active_per_workflow_idx" ON "runs" USING btree ("workflow_id") WHERE "runs"."status" in ('queued', 'running', 'waiting');--> statement-breakpoint
CREATE INDEX "workflows_project_id_updated_at_idx" ON "workflows" USING btree ("project_id","updated_at");--> statement-breakpoint
CREATE INDEX "workflows_user_id_idx" ON "workflows" USING btree ("user_id");