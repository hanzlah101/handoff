"use client";

import { FormError, FormField, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// The emailed verification code, used by every flow that sends one.
export function CodeField({
  error,
  isDisabled,
  onChange,
  value,
}: {
  error: string | undefined;
  isDisabled: boolean;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <FormField
      autoComplete="one-time-code"
      autoFocus
      inputMode="numeric"
      isDisabled={isDisabled}
      isInvalid={error !== undefined}
      onChange={onChange}
      value={value}
    >
      <FormLabel>Code</FormLabel>
      <Input placeholder="123456" />
      <FormError>{error}</FormError>
    </FormField>
  );
}
