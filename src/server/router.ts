import { sessionRouter } from "@/server/modules/session/session.router";

export const router = {
  session: sessionRouter,
};

export type AppRouter = typeof router;
