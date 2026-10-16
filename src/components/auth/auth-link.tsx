import { cn } from "cn";
import Link from "next/link";
import type * as React from "react";

const AUTH_LINK_CLASS =
  "rounded-sm font-medium text-primary underline-offset-4 outline-ring hover:underline focus-visible:outline-2 focus-visible:outline-offset-2";

// Inline link between the auth screens ("Sign up", "Forgot password?").
function AuthLink({ className, ...props }: React.ComponentProps<typeof Link>) {
  return <Link className={cn(AUTH_LINK_CLASS, className)} {...props} />;
}

// The same look for an inline action that stays on the page.
function AuthLinkButton({
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "type">) {
  return (
    <button
      className={cn(AUTH_LINK_CLASS, className)}
      type="button"
      {...props}
    />
  );
}

export { AuthLink, AuthLinkButton };
