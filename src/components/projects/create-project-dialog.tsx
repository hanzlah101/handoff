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
import { FormError, FormField, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PROJECT_NAME_MAX_LENGTH } from "@/server/modules/projects/projects.constants";
import { createProjectInputSchema } from "@/server/modules/projects/projects.schemas";

// `children` is the button that opens it. The dialog closes as soon as the
// name is valid; the project appears optimistically (useCreateProject).
export function CreateProjectDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const createProject = useCreateProject();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();

  function openChange(open: boolean) {
    setIsOpen(open);

    if (!open) {
      setName("");
      setError(undefined);
    }
  }

  function submit() {
    const parsed = createProjectInputSchema.safeParse({ name });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }

    createProject.mutate({ id: crypto.randomUUID(), name: parsed.data.name });
    openChange(false);
  }

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={openChange}>
      {children}
      <Dialog>
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
          <FormField
            autoComplete="off"
            autoFocus
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
            <DialogClose>Cancel</DialogClose>
            <Button type="submit">Create project</Button>
          </DialogFooter>
        </Form>
      </Dialog>
    </DialogTrigger>
  );
}
