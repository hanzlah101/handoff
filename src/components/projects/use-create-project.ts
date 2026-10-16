"use client";

import { isDefinedError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { orpc } from "@/lib/orpc";
import type {
  CreateProjectInput,
  Project,
} from "@/server/modules/projects/projects.schemas";

// The list as it was before the optimistic insert, to restore on failure.
type Snapshot = { previous: Project[] | undefined };

function optimisticProject({ id, name }: CreateProjectInput): Project {
  const now = new Date();
  return {
    createdAt: now,
    id: id ?? crypto.randomUUID(),
    name: name.trim(),
    updatedAt: now,
  };
}

// Optimistic: the project shows in the list at once (with the id the server
// will keep), rolls back with a toast if the server refuses, and the list
// re-syncs with the server either way.
export function useCreateProject() {
  const queryClient = useQueryClient();
  const queryKey = orpc.projects.list.queryKey();

  return useMutation(
    orpc.projects.create.mutationOptions({
      onError: (error, _input, snapshot: Snapshot | undefined) => {
        queryClient.setQueryData(queryKey, snapshot?.previous);
        toast.error("Couldn't create the project", {
          description: isDefinedError(error)
            ? error.message
            : "Something went wrong. Try again.",
        });
      },
      onMutate: async (input): Promise<Snapshot> => {
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData(queryKey);

        queryClient.setQueryData(queryKey, (projects = []) => [
          optimisticProject(input),
          ...projects,
        ]);

        return { previous };
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({ queryKey });
      },
    })
  );
}
