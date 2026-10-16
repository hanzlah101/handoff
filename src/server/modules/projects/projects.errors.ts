import { defineError } from "@/server/errors";

// Also for another user's project, so ids don't reveal what exists.
export const ProjectsNotFound = defineError("PROJECTS_NOT_FOUND", {
  message: "That project doesn't exist or was deleted.",
  status: 404,
});
