import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Clock,
  Filter,
  Loader2,
  Play,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiGet } from "@/lib/api";
import { cn } from "@/lib/utils";

import type { UseTimerReturn } from "@/hooks/useTimer";
import type { Project, SprintTask } from "@/types";

interface TimerViewProps {
  projects: Project[];
  timer: UseTimerReturn;
  activeTask: SprintTask | null;
  onTimerStart: (task: SprintTask) => void;
}

const STATUS_FILTERS = [
  "All",
  "Open",
  "Working",
  "Pending Review",
  "Overdue",
  "Completed",
] as const;

const STATUS_VARIANTS: Record<
  string,
  "neutral" | "info" | "warning" | "danger" | "success"
> = {
  Open: "neutral",
  Working: "info",
  "Pending Review": "warning",
  Overdue: "danger",
  Completed: "success",
  Cancelled: "danger",
};

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: "bg-red-500",
  High: "bg-orange-500",
  Medium: "bg-yellow-500",
  Low: "bg-blue-500",
};

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function TimerView({ timer, activeTask, onTimerStart }: TimerViewProps) {
  const [tasks, setTasks] = useState<SprintTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskError, setTaskError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [pendingStartTask, setPendingStartTask] = useState<SprintTask | null>(
    null
  );
  const [confirmInput, setConfirmInput] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const fetchTasks = useCallback(() => {
    setTasksLoading(true);
    setTaskError(false);
    apiGet<{ message: SprintTask[] }>(
      "/api/method/wela_erpnext.api.get_user_sprint_backlog_tasks"
    )
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.message ?? [];
        setTasks(list);
      })
      .catch(() => {
        setTasks([]);
        setTaskError(true);
      })
      .finally(() => setTasksLoading(false));
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (statusFilter !== "All") {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.subject?.toLowerCase().includes(q) ||
          t.name?.toLowerCase().includes(q) ||
          t.project?.toLowerCase().includes(q) ||
          t.project_name?.toLowerCase().includes(q) ||
          t.status?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [tasks, search, statusFilter]);

  const requestStart = useCallback(
    (task: SprintTask) => {
      if (activeTask) return;
      setPendingStartTask(task);
      setConfirmInput("");
    },
    [activeTask]
  );

  const confirmStart = useCallback(() => {
    if (!pendingStartTask) return;
    onTimerStart(pendingStartTask);
    setPendingStartTask(null);
    setConfirmInput("");
  }, [pendingStartTask, onTimerStart]);

  const cancelStart = useCallback(() => {
    setPendingStartTask(null);
    setConfirmInput("");
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: tasks.length };
    for (const t of tasks) {
      counts[t.status] = (counts[t.status] || 0) + 1;
    }
    return counts;
  }, [tasks]);

  const isTimerActive = activeTask !== null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Tasks</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {tasksLoading
              ? "Loading..."
              : `${filteredTasks.length} task${
                  filteredTasks.length !== 1 ? "s" : ""
                }`}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 text-muted-foreground"
          onClick={fetchTasks}
          disabled={tasksLoading}
        >
          <RefreshCw size={15} className={cn(tasksLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              ref={searchRef}
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Button
            size="icon"
            variant={showFilters ? "secondary" : "ghost"}
            className="size-9 shrink-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={15} />
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => {
              const count = statusCounts[s] ?? 0;
              if (s !== "All" && count === 0) return null;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    statusFilter === s
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {s}
                  <span className="ml-1.5 opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Task List */}
      {tasksLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <Loader2 size={24} className="animate-spin" />
          <span className="text-sm">Loading tasks...</span>
        </div>
      ) : taskError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle size={24} />
          </div>
          <p className="text-sm text-muted-foreground">Failed to load tasks</p>
          <Button size="sm" variant="outline" onClick={fetchTasks}>
            Try Again
          </Button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Clock size={24} strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {search || statusFilter !== "All"
              ? "No matching tasks"
              : "No tasks assigned"}
          </p>
          {(search || statusFilter !== "All") && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filteredTasks.map((task) => {
            const isActive = activeTask?.name === task.name;
            return (
              <TaskRow
                key={task.name}
                task={task}
                isActive={isActive}
                isTimerActive={isTimerActive}
                timerRunning={timer.isRunning}
                elapsed={isActive ? timer.elapsed : 0}
                onStart={requestStart}
              />
            );
          })}
        </div>
      )}

      {/* Start Confirmation Dialog */}
      <Dialog
        open={pendingStartTask !== null}
        onOpenChange={(open) => {
          if (!open) cancelStart();
        }}
      >
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play size={18} className="text-primary" />
              Start Timer
            </DialogTitle>
            <DialogDescription>
              Type the task ID{" "}
              <span className="font-mono font-semibold text-foreground">
                {pendingStartTask?.name}
              </span>{" "}
              to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <p className="truncate text-sm font-medium text-foreground">
              {pendingStartTask?.subject}
            </p>
            <Input
              autoFocus
              placeholder={pendingStartTask?.name ?? "Task ID"}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  confirmInput === pendingStartTask?.name
                )
                  confirmStart();
              }}
              className="font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={cancelStart}>
              Cancel
            </Button>
            <Button
              disabled={confirmInput !== pendingStartTask?.name}
              onClick={confirmStart}
              className="gap-2"
            >
              <Play size={14} fill="currentColor" />
              Start
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TaskRowProps {
  task: SprintTask;
  isActive: boolean;
  isTimerActive: boolean;
  timerRunning: boolean;
  elapsed: number;
  onStart: (task: SprintTask) => void;
}

function TaskRow({
  task,
  isActive,
  isTimerActive,
  timerRunning,
  elapsed,
  onStart,
}: TaskRowProps) {
  const canStart = !isTimerActive;
  const statusVariant = STATUS_VARIANTS[task.status] || "neutral";
  const priorityDot = PRIORITY_COLORS[task.priority] || "bg-zinc-500";

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border px-3 py-3 transition-all",
        isActive
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card hover:border-border/80 hover:bg-accent/50"
      )}
    >
      {/* Priority dot */}
      <div
        className={cn("size-2 shrink-0 rounded-full", priorityDot)}
        title={task.priority}
      />

      {/* Task info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "truncate text-sm font-medium",
            isActive ? "text-primary" : "text-foreground"
          )}
        >
          {task.subject || task.name}
        </span>
        <div className="flex items-center gap-2">
          <span className="truncate text-[11px] text-muted-foreground">
            {task.name}
          </span>
          {task.project_name && (
            <>
              <span className="text-[11px] text-border">·</span>
              <span className="truncate text-[11px] text-muted-foreground">
                {task.project_name}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Status */}
      <Badge variant={statusVariant} className="shrink-0 text-[10px]">
        {task.status}
      </Badge>

      {/* Sprint points */}
      {task.sprint_points > 0 && (
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
          {task.sprint_points} SP
        </span>
      )}

      {/* Active timer display */}
      {isActive && (
        <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-primary">
          {formatElapsed(elapsed)}
        </span>
      )}

      {/* Play button */}
      {!isActive && (
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "size-8 shrink-0 rounded-full transition-all",
            canStart
              ? "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-primary/15 hover:text-primary"
              : "cursor-not-allowed text-muted-foreground/30 opacity-0"
          )}
          disabled={!canStart}
          onClick={(e) => {
            e.stopPropagation();
            onStart(task);
          }}
          title={canStart ? "Start timer" : "Stop the active timer first"}
        >
          <Play size={14} fill="currentColor" />
        </Button>
      )}
    </div>
  );
}
