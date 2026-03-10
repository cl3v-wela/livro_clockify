import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { TimeEntry, Project } from "../types";

interface TimeEntryRowProps {
  entry: TimeEntry;
  projects: Project[];
  onDelete: (id: string) => void;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TimeEntryRow({ entry, projects, onDelete }: TimeEntryRowProps) {
  const project = projects.find((p) => p.name === entry.project);

  return (
    <div className="group flex items-center justify-between rounded-lg border border-transparent bg-card px-3.5 py-2.5 transition-colors hover:border-border hover:bg-accent/30">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className="h-7 w-[3px] shrink-0 rounded-full"
          style={{ backgroundColor: project?.color || "#555" }}
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[13px] font-medium">
            {entry.description || "No description"}
          </span>
          <div className="flex items-center gap-2">
            {project && (
              <Badge
                variant="outline"
                className="h-5 border-none px-0 text-[11px] font-semibold"
                style={{ color: project.color }}
              >
                {project.name}
              </Badge>
            )}
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {format(new Date(entry.startTime), "HH:mm")}
              {entry.endTime &&
                ` - ${format(new Date(entry.endTime), "HH:mm")}`}
            </span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="min-w-[60px] text-right text-sm font-bold tabular-nums text-foreground">
          {formatDuration(entry.duration)}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(entry.id)}
            >
              <Trash2 size={13} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Delete entry</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
