"use client";

import { useState } from "react";
import { Form } from "react-aria-components";

import { useRenameProject } from "@/components/projects/use-project-mutations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FormAlert,
  FormError,
  FormField,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/errors";
import { PROJECT_NAME_MAX_LENGTH } from "@/server/modules/projects/projects.constants";
import { renameProjectInputSchema } from "@/server/modules/projects/projects.schemas";
import type { Project } from "@/server/modules/projects/projects.schemas";

type RenameProject = ReturnType<typeof useRenameProject>;

// Starts from the current name: the card remounts the dialog on each open.
function RenameProjectForm({
  onDone,
  project,
  renameProject,
}: {
  onDone: () => void;
  project: Pick<Project, "id" | "name">;
  renameProject: RenameProject;
}) {
  const [name, setName] = useState(project.name);
  const [error, setError] = useState<string>();
  const isPending = renameProject.isPending || renameProject.isSuccess;

  function submit() {
    const parsed = renameProjectInputSchema.safeParse({ id: project.id, name });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }

    if (parsed.data.name === project.name) {
      onDone();
      return;
    }

    renameProject.mutate(parsed.data, { onSuccess: onDone });
  }

  return (
    <Form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      validationBehavior="aria"
    >
      {renameProject.error === null ? null : (
        <FormAlert>{errorMessage(renameProject.error)}</FormAlert>
      )}

      <FormField
        autoComplete="off"
        autoFocus
        isReadOnly={isPending}
        isInvalid={error !== undefined}
        maxLength={PROJECT_NAME_MAX_LENGTH}
        onChange={(value) => {
          setName(value);
          setError(undefined);
        }}
        onFocus={(event) => {
          event.target.select();
        }}
        value={name}
      >
        <FormLabel>Name</FormLabel>
        <Input />
        <FormError>{error}</FormError>
      </FormField>

      <DialogFooter>
        <DialogClose isDisabled={isPending}>Cancel</DialogClose>
        <Button isLoading={isPending} type="submit">
          Save
        </Button>
      </DialogFooter>
    </Form>
  );
}

// The dialog stays open (and can't be dismissed) while the rename is saved.
export function RenameProjectDialog({
  isOpen,
  onOpenChange,
  project,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  project: Pick<Project, "id" | "name">;
}) {
  const renameProject = useRenameProject();
  // Success counts as busy too: the dialog closes from the success callback,
  // one render after the mutation stops pending.
  const isPending = renameProject.isPending || renameProject.isSuccess;

  function close() {
    onOpenChange(false);
  }

  return (
    <Dialog
      isDismissable={!isPending}
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
      <DialogHeader>
        <DialogTitle>Rename project</DialogTitle>
      </DialogHeader>
      <RenameProjectForm
        onDone={close}
        project={project}
        renameProject={renameProject}
      />
    </Dialog>
  );
}
