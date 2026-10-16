import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";

// A dashed card that stands in for content that doesn't exist yet: media,
// header (title + description), then the action(s).
function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-balance sm:p-12 dark:bg-input/10",
        className
      )}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-sm flex-col items-center gap-2", className)}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "bg-transparent",
        // Cobalt tile with the buttons' top sheen and hairline.
        icon: "relative size-12 rounded-xl bg-primary bg-linear-to-b from-white/12 to-transparent text-primary-foreground shadow-xs-skeuomorphic before:pointer-events-none before:absolute before:inset-px before:rounded-[inherit] before:border before:border-white/12 before:mask-b-from-0% [&_svg:not([class*='size-'])]:size-6",
      },
    },
  }
);

function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ className, variant }))}
      {...props}
    />
  );
}

function EmptyTitle({
  children,
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="empty-title"
      className={cn(
        "font-heading text-xl font-semibold tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-description"
      className={cn(
        "text-sm/relaxed text-pretty text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className
      )}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-2.5 text-sm text-balance",
        className
      )}
      {...props}
    />
  );
}

export {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
};
