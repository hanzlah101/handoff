"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { Form } from "react-aria-components";

import { AuthLink } from "@/components/auth/auth-link";
import { AuthStep } from "@/components/auth/auth-step";
import { CodeField } from "@/components/auth/code-field";
import { useSubmitting } from "@/components/auth/use-submitting";
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

// email → code → new password; then, like sign-in, a device check if asked.
type Step = "code" | "device" | "email" | "password";

export function ForgotPasswordForm() {
  const { errors, fetchStatus, signIn } = useSignIn();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<Step>("email");

  const { isSubmitting, submit } = useSubmitting();
  const isPending = fetchStatus === "fetching";
  const globalError = errors.global?.[0]?.message;
  const emailError = errors.fields.identifier?.message;
  const passwordError = errors.fields.password?.message;
  const codeError = errors.fields.code?.message;

  async function sendCode() {
    const created = await signIn.create({ identifier: email });

    if (created.error !== null) {
      return false;
    }

    const sent = await signIn.resetPasswordEmailCode.sendCode();

    if (sent.error === null) {
      setStep("code");
    }

    return false;
  }

  async function verifyCode() {
    const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code });

    if (error === null && signIn.status === "needs_new_password") {
      setCode("");
      setStep("password");
    }

    return false;
  }

  async function finish() {
    if (signIn.status !== "complete") {
      return false;
    }

    const finalized = await signIn.finalize({ navigate: navigateHome });
    return finalized.error === null;
  }

  async function submitPassword() {
    const { error } = await signIn.resetPasswordEmailCode.submitPassword({
      password,
      signOutOfOtherSessions: true,
    });

    if (error !== null) {
      return false;
    }

    if (
      signIn.status === "needs_client_trust" ||
      signIn.status === "needs_second_factor"
    ) {
      const result = await signIn.mfa.sendEmailCode();

      if (result.error === null) {
        setStep("device");
      }

      return false;
    }

    return await finish();
  }

  async function verifyDevice() {
    const { error } = await signIn.mfa.verifyEmailCode({ code });
    return error === null && (await finish());
  }

  const footer = (
    <>
      Remembered it? <AuthLink href="/sign-in">Back to sign in</AuthLink>
    </>
  );

  const alert =
    globalError === undefined ? null : <FormAlert>{globalError}</FormAlert>;

  if (step === "password") {
    return (
      <AuthStep
        description="Choose a new password. You'll be signed out everywhere else."
        footer={footer}
        title="Set a new password"
      >
        <Form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(submitPassword);
          }}
          validationBehavior="aria"
        >
          {alert}

          <FormField
            autoComplete="new-password"
            autoFocus
            isDisabled={isPending}
            isInvalid={passwordError !== undefined}
            onChange={setPassword}
            value={password}
          >
            <FormLabel>New password</FormLabel>
            <PasswordField />
            <FormError>{passwordError}</FormError>
          </FormField>

          <Button
            isDisabled={isPending}
            isLoading={isSubmitting}
            size="lg"
            type="submit"
          >
            Reset password
          </Button>
        </Form>
      </AuthStep>
    );
  }

  if (step === "code" || step === "device") {
    const isDevice = step === "device";

    return (
      <AuthStep
        description={
          isDevice
            ? `One more step: we sent a sign-in code to ${email}.`
            : `We sent a reset code to ${email}.`
        }
        footer={footer}
        title="Check your email"
      >
        <Form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(isDevice ? verifyDevice : verifyCode);
          }}
          validationBehavior="aria"
        >
          {alert}

          <CodeField
            error={codeError}
            isDisabled={isPending}
            onChange={setCode}
            value={code}
          />

          <Button
            isDisabled={isPending}
            isLoading={isSubmitting}
            size="lg"
            type="submit"
          >
            Verify
          </Button>

          <Button
            className="self-center"
            isDisabled={isPending}
            onPress={() => {
              void (isDevice
                ? signIn.mfa.sendEmailCode()
                : signIn.resetPasswordEmailCode.sendCode());
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
      description="Enter your email and we'll send you a code to reset your password."
      footer={footer}
      title="Forgot your password?"
    >
      <Form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(sendCode);
        }}
        validationBehavior="aria"
      >
        {alert}

        <FormField
          autoComplete="email"
          autoFocus
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

        <Button
          isDisabled={isPending}
          isLoading={isSubmitting}
          size="lg"
          type="submit"
        >
          Send reset code
        </Button>
      </Form>
    </AuthStep>
  );
}
