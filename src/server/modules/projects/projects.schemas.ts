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

export const createProjectInputSchema = z
  .object({
    // Optional client-generated id, so an optimistic row keeps its id (and
    // URL) once the server confirms it.
    id: z.uuid().optional(),
    name: z
      .string()
      .trim()
      .min(1, { error: "Give the project a name." })
      .max(PROJECT_NAME_MAX_LENGTH, {
        error: `Keep the name under ${PROJECT_NAME_MAX_LENGTH} characters.`,
      })
      .meta({ examples: ["Supplier onboarding"] }),
  })
  .meta({ id: "CreateProjectInput" });

export type Project = z.infer<typeof projectSchema>;
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
