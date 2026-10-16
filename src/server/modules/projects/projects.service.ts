import { and, desc, eq } from "drizzle-orm";

import { db } from "@/server/db/client";
import { projects } from "@/server/db/schema";
import type {
  CreateProjectInput,
  RenameProjectInput,
} from "@/server/modules/projects/projects.schemas";

const projectColumns = {
  createdAt: projects.createdAt,
  id: projects.id,
  name: projects.name,
  updatedAt: projects.updatedAt,
};

// Most recently updated first.
export async function listProjects(userId: string) {
  return await db
    .select(projectColumns)
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));
}

// Idempotent per id: retrying a create returns the row it made. Returns null
// when the id already belongs to someone else's project.
export async function createProject(
  userId: string,
  { id, name }: CreateProjectInput
) {
  const [created] = await db
    .insert(projects)
    .values({ id, name, userId })
    .onConflictDoNothing({ target: projects.id })
    .returning(projectColumns);

  if (created !== undefined || id === undefined) {
    return created ?? null;
  }

  const [existing] = await db
    .select(projectColumns)
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));

  return existing ?? null;
}

// Null when the project doesn't exist or isn't the caller's.
export async function renameProject(
  userId: string,
  { id, name }: RenameProjectInput
) {
  const [renamed] = await db
    .update(projects)
    .set({ name })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning(projectColumns);

  return renamed ?? null;
}

// Cascades to the project's workflows and runs. False when the project
// doesn't exist or isn't the caller's.
export async function removeProject(userId: string, id: string) {
  const removed = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning({ id: projects.id });

  return removed.length > 0;
}
