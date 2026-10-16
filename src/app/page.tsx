import { AuthControls } from "@/components/auth-controls";
import { Logo, LogoMark } from "@/components/logo";

export default function Home() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 flex items-center justify-between p-4">
        <Logo />
        <AuthControls />
      </header>
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 p-6 text-center">
        <LogoMark className="size-24 drop-shadow-lg" />
        <h1 className="text-6xl font-bold">Handoff</h1>
        <p className="text-lg text-balance text-muted-foreground">
          Browser automations that know when to ask a human. The agent drives;
          when it hits a login or a captcha, you take the wheel.
        </p>
      </main>
    </>
  );
}
