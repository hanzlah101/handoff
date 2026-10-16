"use client";

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import type { OAuthStrategy } from "@clerk/nextjs/types";
import { IconAlertCircleFilled } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import type { IconType } from "react-icons";

import { GitHubIcon } from "@/components/icons/github-icon";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { clearOAuthFailure, peekOAuthFailure } from "@/lib/auth";

const PROVIDERS = [
  { icon: GoogleIcon, label: "Google", strategy: "oauth_google" },
  { icon: GitHubIcon, label: "GitHub", strategy: "oauth_github" },
] as const satisfies readonly {
  icon: IconType;
  label: string;
  strategy: OAuthStrategy;
}[];

// Signs in or signs up: Clerk creates the account on a first visit. `from`
// is the screen to come back to if the provider fails or the user cancels
// (see src/app/sso-callback/page.tsx).
export function OAuthButtons({ from }: { from: "sign-in" | "sign-up" }) {
  const clerk = useClerk();
  const { fetchStatus: signInStatus, signIn } = useSignIn();
  const { fetchStatus: signUpStatus } = useSignUp();
  const [pending, setPending] = useState<OAuthStrategy | null>(null);
  const [failure, setFailure] = useState(peekOAuthFailure);

  // Busy with something else on the page (the email form): disabled only.
  const isOtherPending =
    pending === null &&
    (signInStatus === "fetching" || signUpStatus === "fetching");

  // Back from a cancelled or failed provider: show why once. Read here,
  // cleared in the effect, so StrictMode's double render still sees it.
  useEffect(() => {
    clearOAuthFailure();
  }, []);

  // Back via the back-forward cache (Safari keeps the page as it was) while a
  // redirect was under way: the button would spin forever.
  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        setPending(null);
      }
    }

    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  // sso() only starts a new attempt when there is none (or the current one is
  // already an OAuth redirect); with an unfinished one left over (an email
  // sign-in or password reset abandoned halfway; Clerk keeps it across
  // reloads) it resolves without error and without redirecting. So start
  // fresh: reset() swaps in a new attempt, read from the client because this
  // render's `signIn` still points at the old one.
  async function freshSignIn() {
    if (signIn.id === undefined) {
      return signIn;
    }

    await signIn.reset();
    return clerk.client?.signIn.__internal_future ?? signIn;
  }

  async function continueWith(strategy: OAuthStrategy) {
    setPending(strategy);
    setFailure(null);

    try {
      const attempt = await freshSignIn();
      const result = await attempt.sso({
        redirectCallbackUrl: `/sso-callback?from=${from}`,
        redirectUrl: "/projects",
        strategy,
      });

      if (result.error !== null) {
        setPending(null);
        setFailure(result.error.message);
      }
    } catch (error) {
      setPending(null);
      setFailure(
        error instanceof Error
          ? error.message
          : "Couldn't start signing in. Try again."
      );
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {failure === null ? null : (
        <Alert variant="destructive">
          <IconAlertCircleFilled />
          <AlertTitle>{failure}</AlertTitle>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        {PROVIDERS.map(({ icon: Icon, label, strategy }) => (
          <Button
            key={strategy}
            isDisabled={
              isOtherPending || (pending !== null && pending !== strategy)
            }
            isLoading={pending === strategy}
            onPress={() => {
              void continueWith(strategy);
            }}
            size="lg"
            variant="outline"
          >
            {pending === strategy ? null : (
              <Icon className="size-5" data-icon="inline-start" />
            )}
            {label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
