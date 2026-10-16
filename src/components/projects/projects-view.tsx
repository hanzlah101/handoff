"use client";

import { IconFolderPlus, IconPlus } from "@tabler/icons-react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { orpc } from "@/lib/orpc";

export function ProjectsView() {
  const { data: projects } = useSuspenseQuery(
    orpc.projects.list.queryOptions()
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-semibold">Projects</h1>
          <p className="text-pretty text-muted-foreground">
            Each project holds the workflows for one job.
          </p>
        </div>

        {projects.length === 0 ? null : (
          <CreateProjectDialog>
            <Button>
              <IconPlus data-icon="inline-start" />
              New project
            </Button>
          </CreateProjectDialog>
        )}
      </div>

      {projects.length === 0 ? (
        <Empty className="min-h-96">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconFolderPlus />
            </EmptyMedia>
            <EmptyTitle>No projects yet</EmptyTitle>
            <EmptyDescription>
              Create a project to start building browser workflows. When an
              agent gets stuck on a login or a captcha, it hands the wheel to
              you.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateProjectDialog>
              <Button size="lg">
                <IconPlus data-icon="inline-start" />
                Create project
              </Button>
            </CreateProjectDialog>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
