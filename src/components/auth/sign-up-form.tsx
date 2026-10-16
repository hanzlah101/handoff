"use client";

import { useSignUp } from "@clerk/nextjs";
import { useState } from "react";
import { Form } from "react-aria-components";

import { AuthLink } from "@/components/auth/auth-link";
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

export function SignUpForm() {
  const { errors, fetchStatus, signUp } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const isPending = fetchStatus === "fetching";
  const globalError = errors.global?.[0]?.message;
  const emailError = errors.fields.emailAddress?.message;
  const passwordError = errors.fields.password?.message;
  const isVerifying =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  async function submitPassword() {
    const { error } = await signUp.password({ emailAddress: email, password });

    if (error === null) {
      await signUp.verifications.sendEmailCode();
    }
  }

  async function submitCode() {
    const { error } = await signUp.verifications.verifyEmailCode({ code });

    if (error === null && signUp.status === "complete") {
      await signUp.finalize({ navigate: navigateHome });
    }
  }

  const footer = (
    <>
      Already have an account? <AuthLink href="/sign-in">Sign in</AuthLink>
    </>
  );

  if (isVerifying) {
    return (
      <AuthStep
        description={`We sent a verification code to ${signUp.emailAddress ?? email}.`}
        footer={footer}
        title="Verify your email"
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
              void signUp.verifications.sendEmailCode();
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
      description="Let your agents drive. Step in only when they need you."
      footer={footer}
      title="Create your account"
    >
      <div className="flex flex-col gap-5">
        <OAuthButtons from="sign-up" />

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
            autoComplete="new-password"
            isDisabled={isPending}
            isInvalid={passwordError !== undefined}
            onChange={setPassword}
            value={password}
          >
            <FormLabel>Password</FormLabel>
            <PasswordField />
            <FormError>{passwordError}</FormError>
          </FormField>

          {/* Clerk's bot protection renders its challenge here. */}
          <div className="empty:hidden" id="clerk-captcha" />

          <Button isLoading={isPending} size="lg" type="submit">
            Create account
          </Button>
        </Form>
      </div>
    </AuthStep>
  );
}
