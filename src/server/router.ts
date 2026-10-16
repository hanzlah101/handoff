import { projectsRouter } from "@/server/modules/projects/projects.router";
import { sessionRouter } from "@/server/modules/session/session.router";

export const router = {
  projects: projectsRouter,
  session: sessionRouter,
};

export type AppRouter = typeof router;
