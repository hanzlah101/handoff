"use client";

import { IconTrashFilled } from "@tabler/icons-react";

import { useRemoveProject } from "@/components/projects/use-project-mutations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Project } from "@/server/modules/projects/projects.schemas";

export function DeleteProjectDialog({
  isOpen,
  onOpenChange,
  project,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  project: Pick<Project, "id" | "name">;
}) {
  const removeProject = useRemoveProject();

  return (
    <AlertDialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogHeader>
        <AlertDialogMedia variant="destructive">
          <IconTrashFilled />
        </AlertDialogMedia>
        <AlertDialogTitle>Delete “{project.name}”?</AlertDialogTitle>
        <AlertDialogDescription>
          Its workflows and their run history are deleted too. This can&apos;t
          be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onPress={() => {
            removeProject.mutate({ id: project.id });
            onOpenChange(false);
          }}
          variant="destructive"
        >
          Delete project
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialog>
  );
}
