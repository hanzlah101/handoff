import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const GUEST_PATHS = [
  "/forgot-password",
  "/sign-in",
  "/sign-up",
  "/sso-callback",
];

function isGuestPath(pathname: string) {
  return GUEST_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

// Signed-in users have no business on the auth pages, so send them to their
// projects. This
// is only a redirect: each protected page, route handler and server action
// checks auth itself with `await auth.protect()` (enforced by the
// @clerk/next/require-auth-protection lint rule).
export default clerkMiddleware(
  async (auth, request) => {
    if (!isGuestPath(request.nextUrl.pathname)) {
      return NextResponse.next();
    }

    const { isAuthenticated } = await auth();

    return isAuthenticated
      ? NextResponse.redirect(new URL("/projects", request.url))
      : NextResponse.next();
  },
  {
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
  }
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
