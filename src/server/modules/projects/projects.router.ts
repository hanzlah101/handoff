import { openapi } from "@orpc/openapi";
import { z } from "zod";

import { inputValidation } from "@/server/core/input-validation";
import { Conflict } from "@/server/errors";
import {
  createProjectInputSchema,
  projectSchema,
} from "@/server/modules/projects/projects.schemas";
import {
  createProject,
  listProjects,
} from "@/server/modules/projects/projects.service";
import { protectedOS } from "@/server/orpc";

const TAGS = ["Projects"];

const list = protectedOS
  .meta(
    openapi({
      description: "The caller's projects, most recently updated first.",
      method: "GET",
      path: "/projects",
      summary: "List projects",
      tags: TAGS,
    })
  )
  .output(z.array(projectSchema))
  .handler(async ({ context }) => await listProjects(context.auth.userId));

const create = protectedOS
  .meta(
    openapi({
      description:
        "Creates a project. Send a client-generated `id` to keep it stable; sending the same `id` again returns the same project.",
      method: "POST",
      path: "/projects",
      successStatus: 201,
      summary: "Create a project",
      tags: TAGS,
    })
  )
  .use(inputValidation)
  .input(createProjectInputSchema)
  .output(projectSchema)
  .errors({ [Conflict.code]: Conflict })
  .handler(async ({ context, input }) => {
    const project = await createProject(context.auth.userId, input);

    if (project === null) {
      throw new Conflict({ message: "That project id is already in use." });
    }

    return project;
  });

export const projectsRouter = { create, list };
