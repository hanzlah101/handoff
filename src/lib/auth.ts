import type { SetActiveNavigate } from "@clerk/nextjs/types";

// After sign-in or sign-up: a full page load, so the server and proxy see the
// new session straight away.
export function navigateHome({
  decorateUrl,
}: Parameters<SetActiveNavigate>[0]) {
  window.location.assign(decorateUrl("/"));
}
