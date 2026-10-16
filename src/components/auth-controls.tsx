"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

function AuthControls() {
  return (
    <div className="flex items-center gap-2">
      <Show when="signed-out">
        <Link href="/sign-in" className={buttonVariants({ variant: "ghost" })}>
          Sign in
        </Link>
        <Link href="/sign-up" className={buttonVariants()}>
          Sign up
        </Link>
      </Show>
      <Show when="signed-in">
        <Link href="/projects" className={buttonVariants({ variant: "ghost" })}>
          Projects
        </Link>
        <UserButton />
      </Show>
    </div>
  );
}

export { AuthControls };
