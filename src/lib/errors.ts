import { ORPCError } from "@orpc/client";

// A typed API error carries a message written for people; anything else
// (network, a crash) gets a generic one.
export function errorMessage(error: Error) {
  return error instanceof ORPCError && error.defined
    ? error.message
    : "Something went wrong. Try again.";
}
