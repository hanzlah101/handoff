"use client";

import { IconAlertCircleFilled } from "@tabler/icons-react";
import { cn } from "cn";
import type * as React from "react";
import {
  composeRenderProps,
  FieldError as FieldErrorPrimitive,
  TextField,
} from "react-aria-components";
import type { FieldErrorProps, TextFieldProps } from "react-aria-components";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

// A text control (Input, PasswordField) with its label and error.
function FormField({ className, ...props }: TextFieldProps) {
  return (
    <TextField
      data-slot="form-field"
      className={composeRenderProps(className, (renderClassName) =>
        cn("group/form-field flex flex-col gap-2", renderClassName)
      )}
      {...props}
    />
  );
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="form-label"
      className={cn(
        "group-data-invalid/form-field:text-destructive group-data-disabled/form-field:opacity-50",
        className
      )}
      {...props}
    />
  );
}

// Shown only while the surrounding FormField is invalid.
function FormError({ className, ...props }: FieldErrorProps) {
  return (
    <FieldErrorPrimitive
      data-slot="form-error"
      className={composeRenderProps(className, (renderClassName) =>
        cn("text-sm text-destructive", renderClassName)
      )}
      {...props}
    />
  );
}

// An error that belongs to the whole form rather than one field.
function FormAlert({
  children,
  ...props
}: Omit<React.ComponentProps<typeof Alert>, "variant">) {
  return (
    <Alert data-slot="form-alert" variant="destructive" {...props}>
      <IconAlertCircleFilled />
      <AlertTitle>{children}</AlertTitle>
    </Alert>
  );
}

export { FormAlert, FormError, FormField, FormLabel };
