"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type * as React from "react";

import { Toaster } from "@/components/ui/sonner";
import { makeQueryClient } from "@/lib/query-client";

let browserQueryClient: QueryClient | undefined;

// A fresh client for each server render; one per tab in the browser, kept
// even if React suspends and remounts the tree during the first render.
function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange>
      <QueryClientProvider client={getQueryClient()}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
