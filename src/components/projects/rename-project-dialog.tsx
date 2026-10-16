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
import { FormError, FormField, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PROJECT_NAME_MAX_LENGTH } from "@/server/modules/projects/projects.constants";
import { renameProjectInputSchema } from "@/server/modules/projects/projects.schemas";
import type { Project } from "@/server/modules/projects/projects.schemas";

// Mounted only while the dialog is open, so it starts from the current name.
function RenameProjectForm({
  onDone,
  project,
}: {
  onDone: () => void;
  project: Pick<Project, "id" | "name">;
}) {
  const renameProject = useRenameProject();
  const [name, setName] = useState(project.name);
  const [error, setError] = useState<string>();

  function submit() {
    const parsed = renameProjectInputSchema.safeParse({ id: project.id, name });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }

    if (parsed.data.name !== project.name) {
      renameProject.mutate(parsed.data);
    }

    onDone();
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
      <FormField
        autoComplete="off"
        autoFocus
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
        <DialogClose>Cancel</DialogClose>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </Form>
  );
}

export function RenameProjectDialog({
  isOpen,
  onOpenChange,
  project,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  project: Pick<Project, "id" | "name">;
}) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Rename project</DialogTitle>
      </DialogHeader>
      <RenameProjectForm
        onDone={() => {
          onOpenChange(false);
        }}
        project={project}
      />
    </Dialog>
  );
}
