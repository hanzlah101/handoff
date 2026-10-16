"use client";

import { HandleSSOCallback } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { Spinner } from "@/components/ui/spinner";
import { navigateHome } from "@/lib/auth";

// Google and GitHub send the user back here to finish signing in or up.
export default function SSOCallbackPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <Spinner className="size-6" />
      <HandleSSOCallback
        navigateToApp={navigateHome}
        navigateToSignIn={() => {
          router.push("/sign-in");
        }}
        navigateToSignUp={() => {
          router.push("/sign-up");
        }}
      />
    </main>
  );
}
