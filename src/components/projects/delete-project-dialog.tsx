"use client";

import { IconAlertCircleFilled, IconTrashFilled } from "@tabler/icons-react";

import { useRemoveProject } from "@/components/projects/use-project-mutations";
import { Alert, AlertTitle } from "@/components/ui/alert";
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
import { errorMessage } from "@/lib/errors";
import type { Project } from "@/server/modules/projects/projects.schemas";

// Stays open (and can't be cancelled) while the project is deleted.
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
  // Success counts as busy too: the dialog closes from the success callback,
  // one render after the mutation stops pending.
  const isPending = removeProject.isPending || removeProject.isSuccess;

  function close() {
    onOpenChange(false);
  }

  return (
    <AlertDialog
      isKeyboardDismissDisabled={isPending}
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (open) {
          onOpenChange(true);
        } else if (!isPending) {
          close();
        }
      }}
    >
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
      {removeProject.error === null ? null : (
        <Alert variant="destructive">
          <IconAlertCircleFilled />
          <AlertTitle>{errorMessage(removeProject.error)}</AlertTitle>
        </Alert>
      )}
      <AlertDialogFooter>
        <AlertDialogCancel isDisabled={isPending}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          isLoading={isPending}
          onPress={() => {
            removeProject.mutate({ id: project.id }, { onSuccess: close });
          }}
          variant="destructive"
        >
          Delete project
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialog>
  );
}
