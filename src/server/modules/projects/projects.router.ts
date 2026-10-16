import { openapi } from "@orpc/openapi";
import { z } from "zod";

import { inputValidation } from "@/server/core/input-validation";
import { Conflict } from "@/server/errors";
import { ProjectsNotFound } from "@/server/modules/projects/projects.errors";
import {
  createProjectInputSchema,
  projectSchema,
  removeProjectInputSchema,
  renameProjectInputSchema,
} from "@/server/modules/projects/projects.schemas";
import {
  createProject,
  listProjects,
  removeProject,
  renameProject,
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

const rename = protectedOS
  .meta(
    openapi({
      description: "Renames one of the caller's projects.",
      method: "PATCH",
      path: "/projects/{id}",
      summary: "Rename a project",
      tags: TAGS,
    })
  )
  .use(inputValidation)
  .input(renameProjectInputSchema)
  .output(projectSchema)
  .errors({ [ProjectsNotFound.code]: ProjectsNotFound })
  .handler(async ({ context, input }) => {
    const project = await renameProject(context.auth.userId, input);

    if (project === null) {
      throw new ProjectsNotFound();
    }

    return project;
  });

const remove = protectedOS
  .meta(
    openapi({
      description:
        "Deletes one of the caller's projects with its workflows and their runs.",
      method: "DELETE",
      path: "/projects/{id}",
      successStatus: 204,
      summary: "Delete a project",
      tags: TAGS,
    })
  )
  .use(inputValidation)
  .input(removeProjectInputSchema)
  .errors({ [ProjectsNotFound.code]: ProjectsNotFound })
  .handler(async ({ context, input }) => {
    const removed = await removeProject(context.auth.userId, input.id);

    if (!removed) {
      throw new ProjectsNotFound();
    }
  });

export const projectsRouter = { create, list, remove, rename };
