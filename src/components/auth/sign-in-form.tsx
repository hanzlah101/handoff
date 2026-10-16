"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { Form } from "react-aria-components";

import { AuthLink, AuthLinkButton } from "@/components/auth/auth-link";
import { AuthStep } from "@/components/auth/auth-step";
import { CodeField } from "@/components/auth/code-field";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import {
  FormAlert,
  FormError,
  FormField,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/ui/password-field";
import { navigateHome } from "@/lib/auth";

export function SignInForm() {
  const { errors, fetchStatus, signIn } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"code" | "password">("password");

  const isPending = fetchStatus === "fetching";
  const globalError = errors.global?.[0]?.message;
  const emailError = errors.fields.identifier?.message;
  const passwordError = errors.fields.password?.message;

  async function finish() {
    if (signIn.status === "complete") {
      await signIn.finalize({ navigate: navigateHome });
    }
  }

  async function submitPassword() {
    const { error } = await signIn.password({ emailAddress: email, password });

    if (error !== null) {
      return;
    }

    // A new device, or an account with two-step verification: confirm with a
    // code sent to the email address.
    if (
      signIn.status === "needs_client_trust" ||
      signIn.status === "needs_second_factor"
    ) {
      const result = await signIn.mfa.sendEmailCode();

      if (result.error === null) {
        setStep("code");
      }

      return;
    }

    await finish();
  }

  async function submitCode() {
    const { error } = await signIn.mfa.verifyEmailCode({ code });

    if (error === null) {
      await finish();
    }
  }

  async function startOver() {
    await signIn.reset();
    setCode("");
    setStep("password");
  }

  if (step === "code") {
    return (
      <AuthStep
        description={`We sent a verification code to ${email}.`}
        footer={
          <>
            Not you?{" "}
            <AuthLinkButton
              onClick={() => {
                void startOver();
              }}
            >
              Start over
            </AuthLinkButton>
          </>
        }
        title="Check your email"
      >
        <Form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submitCode();
          }}
          validationBehavior="aria"
        >
          {globalError === undefined ? null : (
            <FormAlert>{globalError}</FormAlert>
          )}

          <CodeField
            error={errors.fields.code?.message}
            isDisabled={isPending}
            onChange={setCode}
            value={code}
          />

          <Button isLoading={isPending} size="lg" type="submit">
            Verify
          </Button>

          <Button
            className="self-center"
            isDisabled={isPending}
            onPress={() => {
              void signIn.mfa.sendEmailCode();
            }}
            size="sm"
            variant="ghost"
          >
            Send a new code
          </Button>
        </Form>
      </AuthStep>
    );
  }

  return (
    <AuthStep
      description="Sign in to pick up where your agents left off."
      footer={
        <>
          No account? <AuthLink href="/sign-up">Sign up</AuthLink>
        </>
      }
      title="Welcome back"
    >
      <div className="flex flex-col gap-5">
        <OAuthButtons from="sign-in" />

        <Form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submitPassword();
          }}
          validationBehavior="aria"
        >
          {globalError === undefined ? null : (
            <FormAlert>{globalError}</FormAlert>
          )}

          <FormField
            autoComplete="email"
            isDisabled={isPending}
            isInvalid={emailError !== undefined}
            onChange={setEmail}
            type="email"
            value={email}
          >
            <FormLabel>Email</FormLabel>
            <Input placeholder="you@company.com" />
            <FormError>{emailError}</FormError>
          </FormField>

          <FormField
            autoComplete="current-password"
            isDisabled={isPending}
            isInvalid={passwordError !== undefined}
            onChange={setPassword}
            value={password}
          >
            <div className="flex items-center justify-between">
              <FormLabel>Password</FormLabel>
              <AuthLink className="text-sm" href="/forgot-password">
                Forgot password?
              </AuthLink>
            </div>
            <PasswordField />
            <FormError>{passwordError}</FormError>
          </FormField>

          <Button isLoading={isPending} size="lg" type="submit">
            Sign in
          </Button>
        </Form>
      </div>
    </AuthStep>
  );
}
