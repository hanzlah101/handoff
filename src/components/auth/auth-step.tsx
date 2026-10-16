import type * as React from "react";

// One screen of an auth flow: heading, the form, and an optional footnote
// (the link to the other flow), centred under the form.
export function AuthStep({
  children,
  description,
  footer,
  title,
}: {
  children: React.ReactNode;
  description: React.ReactNode;
  footer?: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-balance">{title}</h1>
        <p className="text-pretty text-muted-foreground">{description}</p>
      </div>

      {children}

      {footer === undefined ? null : (
        <p className="text-center text-sm text-muted-foreground">{footer}</p>
      )}
    </div>
  );
}
