import { z } from "zod";

import { PROJECT_NAME_MAX_LENGTH } from "@/server/modules/projects/projects.constants";

export const projectSchema = z
  .object({
    createdAt: z.date(),
    id: z.uuid(),
    name: z.string().meta({ examples: ["Supplier onboarding"] }),
    updatedAt: z.date(),
  })
  .meta({ id: "Project" });

// Trimmed, 1–60 characters; shared by create and rename (and the dialogs).
const projectNameSchema = z
  .string()
  .trim()
  .min(1, { error: "Give the project a name." })
  .max(PROJECT_NAME_MAX_LENGTH, {
    error: `Keep the name under ${PROJECT_NAME_MAX_LENGTH} characters.`,
  })
  .meta({ examples: ["Supplier onboarding"] });

export const createProjectInputSchema = z
  .object({
    // Optional client-generated id, so an optimistic row keeps its id (and
    // URL) once the server confirms it.
    id: z.uuid().optional(),
    name: projectNameSchema,
  })
  .meta({ id: "CreateProjectInput" });

export const renameProjectInputSchema = z
  .object({ id: z.uuid(), name: projectNameSchema })
  .meta({ id: "RenameProjectInput" });

export const removeProjectInputSchema = z
  .object({ id: z.uuid() })
  .meta({ id: "RemoveProjectInput" });

export type Project = z.infer<typeof projectSchema>;
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
export type RenameProjectInput = z.infer<typeof renameProjectInputSchema>;
