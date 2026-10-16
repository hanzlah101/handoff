import Image from "next/image";

import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh lg:grid lg:grid-cols-2">
      <figure className="relative hidden overflow-hidden bg-muted lg:block">
        <Image
          alt=""
          className="object-cover object-top dark:hidden"
          fetchPriority="high"
          fill
          sizes="50vw"
          src="/images/login-light-v2.webp"
        />
        <Image
          alt=""
          className="hidden object-cover object-top dark:block"
          fetchPriority="high"
          fill
          sizes="50vw"
          src="/images/login-dark-v2.webp"
        />
        <figcaption className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-linear-to-t from-background via-background/95 to-transparent p-8 pt-24 xl:p-12 xl:pt-28">
          <p className="max-w-lg font-heading text-4xl font-semibold tracking-tight text-balance xl:text-5xl">
            Your agents drive. You take the wheel.
          </p>
          <p className="max-w-md text-lg text-pretty text-foreground/80">
            When a run hits a login or a captcha, it waits for you, then carries
            on.
          </p>
        </figcaption>
      </figure>

      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 xl:px-16">
        <div className="flex w-full max-w-100 flex-col gap-10">
          <Logo />
          {children}
        </div>
      </div>
    </main>
  );
}
