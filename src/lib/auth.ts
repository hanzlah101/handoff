import type { SetActiveNavigate } from "@clerk/nextjs/types";

// After sign-in or sign-up: a full page load into the app, so the server and
// proxy see the new session straight away.
export function navigateHome({
  decorateUrl,
}: Parameters<SetActiveNavigate>[0]) {
  window.location.assign(decorateUrl("/projects"));
}

// Why the last Google/GitHub attempt failed or was cancelled: set by the SSO
// callback, shown once by OAuthButtons on the screen it returns to. Kept in
// memory only, so a reload never brings it back (Clerk itself keeps the failed
// attempt across reloads until it is reset).
let oauthFailure: string | null = null;

export function setOAuthFailure(message: string) {
  oauthFailure = message;
}

export function peekOAuthFailure() {
  return oauthFailure;
}

export function clearOAuthFailure() {
  oauthFailure = null;
}
