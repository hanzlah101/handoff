import { cn } from "cn";
import { useId } from "react";
import type * as React from "react";

// The mark from src/app/icon.svg: two cursors passing control, the AI's in
// white and the human's in amber.
function LogoMark({ className, ...props }: React.ComponentProps<"svg">) {
  const gradientId = useId();

  return (
    <svg
      aria-hidden
      viewBox="0 0 64 64"
      className={cn("size-8 shrink-0", className)}
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop
            offset="0"
            className="text-brand-cobalt"
            stopColor="currentColor"
          />
          <stop
            offset="1"
            className="text-brand-cobalt-deep"
            stopColor="currentColor"
          />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${gradientId})`} />
      <path
        d="M14 14 37 22 27 27 22 37Z"
        className="fill-primary-foreground stroke-primary-foreground"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      <path
        d="M50 50 27 42 37 37 42 27Z"
        className="fill-brand-amber stroke-brand-amber"
        strokeLinejoin="round"
        strokeWidth="4"
      />
    </svg>
  );
}

export { LogoMark };
