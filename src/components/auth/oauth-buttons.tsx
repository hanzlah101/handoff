"use client";

import { useSignIn } from "@clerk/nextjs";
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
  const { signIn } = useSignIn();
  const [pending, setPending] = useState<OAuthStrategy | null>(null);
  const [error, setError] = useState(peekOAuthFailure);

  // Back from a cancelled or failed provider: show why once. Read here,
  // cleared in the effect, so StrictMode's double render still sees it.
  useEffect(() => {
    clearOAuthFailure();
  }, []);

  async function continueWith(strategy: OAuthStrategy) {
    setPending(strategy);
    setError(null);

    const result = await signIn.sso({
      redirectCallbackUrl: `/sso-callback?from=${from}`,
      redirectUrl: "/",
      strategy,
    });

    if (result.error !== null) {
      setPending(null);
      setError(result.error.message);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {error === null ? null : (
        <Alert variant="destructive">
          <IconAlertCircleFilled />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        {PROVIDERS.map(({ icon: Icon, label, strategy }) => (
          <Button
            key={strategy}
            isDisabled={pending !== null && pending !== strategy}
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
