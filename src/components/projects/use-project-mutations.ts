"use client";

import { ORPCError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { orpc } from "@/lib/orpc";
import type {
  CreateProjectInput,
  Project,
  RenameProjectInput,
} from "@/server/modules/projects/projects.schemas";

// Every project mutation is optimistic: the list changes at once, rolls back
// with a toast if the server refuses, and re-syncs with the server either way.

// The list as it was before the optimistic change, to restore on failure.
type Snapshot = { previous: Project[] | undefined };

// Plain functions (not in hook bodies): the React Compiler lint flags
// `new Date()` during render.
function newProject({ id, name }: CreateProjectInput): Project {
  const now = new Date();
  return {
    createdAt: now,
    id: id ?? crypto.randomUUID(),
    name: name.trim(),
    updatedAt: now,
  };
}

// Renaming bumps updatedAt, so the project moves to the top (newest first).
function renamed(projects: Project[], { id, name }: RenameProjectInput) {
  const project = projects.find((candidate) => candidate.id === id);

  if (project === undefined) {
    return projects;
  }

  return [
    { ...project, name: name.trim(), updatedAt: new Date() },
    ...projects.filter((candidate) => candidate.id !== id),
  ];
}

function useProjectsCache() {
  const queryClient = useQueryClient();
  const queryKey = orpc.projects.list.queryKey();

  async function change(
    update: (projects: Project[]) => Project[]
  ): Promise<Snapshot> {
    await queryClient.cancelQueries({ queryKey });
    const previous = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, (projects = []) => update(projects));
    return { previous };
  }

  // A typed API error carries a message written for people; anything else
  // (network, a crash) gets a generic one.
  function rollback(
    snapshot: Snapshot | undefined,
    title: string,
    error: Error
  ) {
    queryClient.setQueryData(queryKey, snapshot?.previous);
    toast.error(title, {
      description:
        error instanceof ORPCError && error.defined
          ? error.message
          : "Something went wrong. Try again.",
    });
  }

  async function resync() {
    await queryClient.invalidateQueries({ queryKey });
  }

  return { change, resync, rollback };
}

// Send a client `crypto.randomUUID()` as `id` so the row keeps its id.
export function useCreateProject() {
  const cache = useProjectsCache();

  return useMutation(
    orpc.projects.create.mutationOptions({
      onError: (error, _input, snapshot: Snapshot | undefined) => {
        cache.rollback(snapshot, "Couldn't create the project", error);
      },
      onMutate: async (input) =>
        await cache.change((projects) => [newProject(input), ...projects]),
      onSettled: cache.resync,
    })
  );
}

export function useRenameProject() {
  const cache = useProjectsCache();

  return useMutation(
    orpc.projects.rename.mutationOptions({
      onError: (error, _input, snapshot: Snapshot | undefined) => {
        cache.rollback(snapshot, "Couldn't rename the project", error);
      },
      onMutate: async (input) =>
        await cache.change((projects) => renamed(projects, input)),
      onSettled: cache.resync,
    })
  );
}

export function useRemoveProject() {
  const cache = useProjectsCache();

  return useMutation(
    orpc.projects.remove.mutationOptions({
      onError: (error, _input, snapshot: Snapshot | undefined) => {
        cache.rollback(snapshot, "Couldn't delete the project", error);
      },
      onMutate: async ({ id }) =>
        await cache.change((projects) =>
          projects.filter((project) => project.id !== id)
        ),
      onSettled: cache.resync,
    })
  );
}
