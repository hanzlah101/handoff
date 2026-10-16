import { auth } from "@clerk/nextjs/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";

import { ProjectsView } from "@/components/projects/projects-view";
import { orpc } from "@/lib/orpc.server";
import { makeQueryClient } from "@/lib/query-client";

export const metadata: Metadata = { title: "Projects" };

// Prefetched on the server so the list renders without a loading flash.
export default async function ProjectsPage() {
  await auth.protect();

  const queryClient = makeQueryClient();
  await queryClient.query(orpc.projects.list.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectsView />
    </HydrationBoundary>
  );
}
