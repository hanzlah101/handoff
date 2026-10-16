"use client";

import {
  IconDots,
  IconFolderFilled,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";

import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { RenameProjectDialog } from "@/components/projects/rename-project-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/format";
import type { Project } from "@/server/modules/projects/projects.schemas";

type Action = "delete" | "rename";

export function ProjectCard({ project }: { project: Project }) {
  const [action, setAction] = useState<Action | null>(null);

  function openChange(target: Action) {
    return (isOpen: boolean) => {
      setAction(isOpen ? target : null);
    };
  }

  return (
    <article className="flex items-center gap-4 rounded-xl bg-card p-5 shadow-xs ring-1 ring-border">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <IconFolderFilled className="size-5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
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

      <DropdownMenuTrigger>
        <Button
          aria-label={`Actions for ${project.name}`}
          className="-mr-1.5 shrink-0"
          size="icon-sm"
          variant="ghost"
        >
          <IconDots />
        </Button>
        <DropdownMenu
          onAction={(key) => {
            setAction(key === "delete" ? "delete" : "rename");
          }}
        >
          <DropdownMenuItem id="rename">
            <IconPencil />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem id="delete" variant="destructive">
            <IconTrash />
            Delete
          </DropdownMenuItem>
        </DropdownMenu>
      </DropdownMenuTrigger>

      <RenameProjectDialog
        isOpen={action === "rename"}
        onOpenChange={openChange("rename")}
        project={project}
      />
      <DeleteProjectDialog
        isOpen={action === "delete"}
        onOpenChange={openChange("delete")}
        project={project}
      />
    </article>
  );
}
