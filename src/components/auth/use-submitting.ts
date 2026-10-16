"use client";

import { useState } from "react";

// The spinner for a form's own submit button. Clerk's `fetchStatus` is shared
// by everything using the same sign-in or sign-up (the OAuth buttons too), so
// it only disables controls; this tracks whether this form started the
// request. An action returns true when it signed the user in: the spinner
// then stays on while the page navigates away.
export function useSubmitting() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(action: () => Promise<boolean>) {
    setIsSubmitting(true);
    let isLeaving = false;

    try {
      isLeaving = await action();
    } catch (error) {
      setIsSubmitting(false);
      throw error;
    }

    if (!isLeaving) {
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, submit };
}
