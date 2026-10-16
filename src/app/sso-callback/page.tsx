"use client";

import { HandleSSOCallback, useAuth, useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Spinner } from "@/components/ui/spinner";
import { navigateHome, setOAuthFailure } from "@/lib/auth";

// Google and GitHub send the user back here to finish signing in or up.
export default function SSOCallbackPage() {
  const router = useRouter();
  const { isLoaded } = useAuth();
  const { signIn } = useSignIn();

  // HandleSSOCallback has no branch for a cancelled or failed provider (the
  // attempt is left at needs_identifier with a verification error), so it
  // would spin forever. Keep the reason for OAuthButtons, clear the attempt
  // (Clerk keeps it across reloads), and go back to the screen that started it.
  const { error } = signIn.firstFactorVerification;

  useEffect(() => {
    if (!isLoaded || error === null) {
      return;
    }

    async function returnToStart(message: string) {
      setOAuthFailure(message);
      await signIn.reset();

      const from = new URLSearchParams(window.location.search).get("from");
      router.replace(from === "sign-up" ? "/sign-up" : "/sign-in");
    }

    void returnToStart(error.longMessage ?? error.message);
  }, [error, isLoaded, router, signIn]);

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
