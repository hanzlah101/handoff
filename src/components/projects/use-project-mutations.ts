"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { orpc } from "@/lib/orpc";
import type { Project } from "@/server/modules/projects/projects.schemas";

// Project mutations update the cached list from the server's response on
// success (no optimistic rows, no refetch): the caller shows a pending state
// meanwhile. The list is also marked stale without refetching, so the next
// mount or window focus re-syncs it (e.g. changes from another tab).
function useUpdateProjects() {
  const queryClient = useQueryClient();
  const queryKey = orpc.projects.list.queryKey();

  return (update: (projects: Project[]) => Project[]) => {
    queryClient.setQueryData(queryKey, (projects) =>
      projects === undefined ? projects : update(projects)
    );
    void queryClient.invalidateQueries({ queryKey, refetchType: "none" });
  };
}

// Newest first: a created or renamed project (fresh updatedAt) goes on top.
function putFirst(projects: Project[], project: Project) {
  return [project, ...projects.filter(({ id }) => id !== project.id)];
}

export function useCreateProject() {
  const updateProjects = useUpdateProjects();

  return useMutation(
    orpc.projects.create.mutationOptions({
      onSuccess: (project) => {
        updateProjects((projects) => putFirst(projects, project));
      },
    })
  );
}

export function useRenameProject() {
  const updateProjects = useUpdateProjects();

  return useMutation(
    orpc.projects.rename.mutationOptions({
      onSuccess: (project) => {
        updateProjects((projects) => putFirst(projects, project));
      },
    })
  );
}

export function useRemoveProject() {
  const updateProjects = useUpdateProjects();

  return useMutation(
    orpc.projects.remove.mutationOptions({
      onSuccess: (_result, { id }) => {
        updateProjects((projects) =>
          projects.filter((project) => project.id !== id)
        );
      },
    })
  );
}
