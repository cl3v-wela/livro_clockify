import { memo, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { Project, TimeEntry } from "@/types";

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
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const TimeEntryRow = memo(function TimeEntryRow({
  entry,
  projects,
  onDelete,
}: TimeEntryRowProps) {
  const project = projects.find((p) => p.name === entry.project);
  const handleDelete = useCallback(
    () => onDelete(entry.id),
    [onDelete, entry.id]
  );

  return (
    <div className="group flex items-center justify-between gap-2 rounded-lg border border-transparent bg-card px-2.5 py-2.5 transition-colors hover:border-border hover:bg-accent/30 sm:px-3.5">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
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
        <span className="min-w-[50px] text-right text-xs font-bold tabular-nums text-foreground sm:min-w-[60px] sm:text-sm">
          {formatDuration(entry.duration)}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 size={13} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Delete entry</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
});
