import { IconFolderFilled } from "@tabler/icons-react";

import { formatRelativeTime } from "@/lib/format";
import type { Project } from "@/server/modules/projects/projects.schemas";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="flex items-center gap-4 rounded-xl bg-card p-5 shadow-xs ring-1 ring-border">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <IconFolderFilled className="size-5" />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 className="truncate font-heading text-base font-semibold tracking-tight">
          {project.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          Updated{" "}
          {/* Relative to "now", which differs between server and browser. */}
          <time
            dateTime={project.updatedAt.toISOString()}
            suppressHydrationWarning
          >
            {formatRelativeTime(project.updatedAt)}
          </time>
        </p>
      </div>
    </article>
  );
}
