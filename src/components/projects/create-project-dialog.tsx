"use client";

import { useState } from "react";
import type * as React from "react";
import { Form } from "react-aria-components";

import { useCreateProject } from "@/components/projects/use-project-mutations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createProjectInputSchema } from "@/server/modules/projects/projects.schemas";

// `children` is the button that opens it. The dialog stays open (and can't be
// dismissed) while the project is created, then closes.
export function CreateProjectDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const createProject = useCreateProject();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  // Success counts as busy too: the dialog closes from the success callback,
  // one render after the mutation stops pending.
  const isPending = createProject.isPending || createProject.isSuccess;

  // Reset on open, not on close, so the dialog fades out as it was.
  function open() {
    setName("");
    setError(undefined);
    createProject.reset();
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  function submit() {
    const parsed = createProjectInputSchema.safeParse({ name });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }

    createProject.mutate(parsed.data, { onSuccess: close });
  }

  return (
    <DialogTrigger
      isOpen={isOpen}
      onOpenChange={(isOpening) => {
        if (isOpening) {
          open();
        } else if (!isPending) {
          close();
        }
      }}
    >
      {children}
      <Dialog isDismissable={!isPending} isKeyboardDismissDisabled={isPending}>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            A project groups the workflows for one job, like onboarding a
            supplier or checking competitor prices.
          </DialogDescription>
        </DialogHeader>

        <Form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          validationBehavior="aria"
        >
          {createProject.error === null ? null : (
            <FormAlert>{errorMessage(createProject.error)}</FormAlert>
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
            value={name}
          >
            <FormLabel>Name</FormLabel>
            <Input placeholder="Supplier onboarding" />
            <FormError>{error}</FormError>
          </FormField>

          <DialogFooter>
            <DialogClose isDisabled={isPending}>Cancel</DialogClose>
            <Button isLoading={isPending} type="submit">
              Create project
            </Button>
          </DialogFooter>
        </Form>
      </Dialog>
    </DialogTrigger>
  );
}
