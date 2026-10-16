import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

import { Logo } from "@/components/logo";

// Signed-in pages are request-bound from the top (auth.protect() reads the
// session), so the layout may block; pages stream their data behind loading.tsx.
export const instant = false;

// Signed-in pages: the app header and a centred content column.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  await auth.protect();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Logo />
          <UserButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
