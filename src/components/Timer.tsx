import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Search,
  Square,
} from "lucide-react";
import { v4 as uuid } from "uuid";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTimer } from "@/hooks/useTimer";
import { apiGet } from "@/lib/api";
import { takeScreenshot } from "@/lib/ipc";
import { cn } from "@/lib/utils";

import type { Project, TimeEntry } from "@/types";

interface SprintTask {
  name: string;
  subject: string;
  status?: string;
  project?: string;
}

interface TimerViewProps {
  projects: Project[];
  onSave: (entry: TimeEntry) => void;
}

const TIME_UNITS = [
  { label: "hrs" },
  { label: "min" },
  { label: "sec" },
] as const;

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  return {
    h: String(Math.floor(totalSeconds / 3600)).padStart(2, "0"),
    m: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0"),
    s: String(totalSeconds % 60).padStart(2, "0"),
  };
}

export function TimerView({ projects, onSave }: TimerViewProps) {
  const timer = useTimer();
  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState(
    projects[0]?.name || ""
  );
  const [tasks, setTasks] = useState<SprintTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const [taskError, setTaskError] = useState(false);
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
    if (!taskSearch) return tasks;
    const q = taskSearch.toLowerCase();
    return tasks.filter(
      (t) =>
        t.subject?.toLowerCase().includes(q) ||
        t.name?.toLowerCase().includes(q) ||
        t.project?.toLowerCase().includes(q) ||
        t.status?.toLowerCase().includes(q)
    );
  }, [tasks, taskSearch]);

  const selectedTask = useMemo(
    () =>
      tasks.find((t) => t.subject === description || t.name === description),
    [tasks, description]
  );

  const handleStart = useCallback(() => {
    timer.start();
    takeScreenshot("start").catch(() => {});
  }, [timer]);

  const handleStop = useCallback(() => {
    takeScreenshot("stop").catch(() => {});
    const result = timer.stop();
    const entry: TimeEntry = {
      id: uuid(),
      description: description.trim() || "Untitled",
      project: selectedProject,
      startTime: result.startTime.toISOString(),
      endTime: result.endTime.toISOString(),
      duration: result.duration,
    };
    onSave(entry);
    setDescription("");
  }, [timer, description, selectedProject, onSave]);

  const handleTaskSelect = useCallback(
    (task: SprintTask) => {
      const val = task.subject || task.name;
      setDescription(val);
      setTaskOpen(false);
      setTaskSearch("");
      if (task.project) {
        const match = projects.find((p) => p.name === task.project);
        if (match) setSelectedProject(match.name);
      }
    },
    [projects]
  );

  const currentProject = projects.find((p) => p.name === selectedProject);
  const time = formatElapsed(timer.elapsed);
  const timeValues = [time.h, time.m, time.s];
  const isActive = timer.isRunning || timer.elapsed > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-4 sm:gap-6 md:gap-8">
      {/* Timer Ring */}
      <div
        className={cn(
          "flex size-[180px] items-center justify-center rounded-full border-2 bg-card transition-all duration-300 sm:size-[220px] md:size-[260px]",
          timer.isRunning
            ? "border-primary shadow-[0_0_40px_oklch(0.55_0.2_275/0.3)]"
            : "border-border"
        )}
        style={
          timer.isRunning
            ? { animation: "pulse-glow 2s ease-in-out infinite" }
            : undefined
        }
      >
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-baseline gap-1">
            {TIME_UNITS.map((unit, i) => (
              <div key={unit.label} className="flex items-baseline">
                {i > 0 && (
                  <span className="mx-0.5 pt-0.5 text-xl font-bold text-muted-foreground sm:text-2xl md:text-[28px]">
                    :
                  </span>
                )}
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-extrabold tabular-nums tracking-wide text-foreground sm:text-3xl md:text-4xl">
                    {timeValues[i]}
                  </span>
                  <span className="mt-1 text-[8px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-[9px]">
                    {unit.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {timer.startTime && (
            <span className="mt-2 text-[11px] text-muted-foreground">
              Started{" "}
              {timer.startTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2.5">
        {!timer.isRunning && timer.elapsed === 0 && (
          <Button
            size="lg"
            className="gap-2 rounded-full px-8"
            onClick={handleStart}
          >
            <Play size={20} fill="currentColor" />
            Start Timer
          </Button>
        )}
        {timer.isRunning && (
          <>
            <Button
              size="lg"
              className="gap-2 rounded-full bg-yellow-500 px-6 text-black hover:bg-yellow-400"
              onClick={timer.pause}
            >
              <Pause size={18} />
              Pause
            </Button>
            <Button
              size="lg"
              variant="destructive"
              className="gap-2 rounded-full px-6"
              onClick={handleStop}
            >
              <Square size={16} fill="currentColor" />
              Stop
            </Button>
          </>
        )}
        {!timer.isRunning && timer.elapsed > 0 && (
          <>
            <Button
              size="lg"
              className="gap-2 rounded-full px-6"
              onClick={timer.resume}
            >
              <Play size={18} fill="currentColor" />
              Resume
            </Button>
            <Button
              size="lg"
              variant="destructive"
              className="gap-2 rounded-full px-6"
              onClick={handleStop}
            >
              <Square size={16} fill="currentColor" />
              Stop
            </Button>
            <Button
              size="icon-lg"
              variant="secondary"
              className="rounded-full"
              onClick={timer.reset}
            >
              <RotateCcw size={16} />
            </Button>
          </>
        )}
      </div>

      {/* Task Selection */}
      <div
        className={cn(
          "flex w-full max-w-sm flex-col gap-3 px-2 transition-opacity duration-300 sm:max-w-md sm:px-0",
          isActive ? "opacity-100" : "opacity-60 focus-within:opacity-100"
        )}
      >
        {tasksLoading ? (
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            Loading tasks...
          </div>
        ) : tasks.length > 0 ? (
          <div className="relative">
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={taskOpen}
              onClick={() => setTaskOpen(!taskOpen)}
              className="h-auto min-h-10 w-full justify-between gap-2 px-3 py-2 text-left font-normal"
            >
              {selectedTask ? (
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm">
                    {selectedTask.subject || selectedTask.name}
                  </span>
                  {selectedTask.status && (
                    <span className="truncate text-[11px] text-muted-foreground">
                      {selectedTask.status}
                      {selectedTask.project ? ` · ${selectedTask.project}` : ""}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">
                  What are you working on?
                </span>
              )}
              <ChevronsUpDown
                size={14}
                className="shrink-0 text-muted-foreground"
              />
            </Button>

            {taskOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setTaskOpen(false)}
                />
                <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-popover shadow-lg">
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                    <Search
                      size={14}
                      className="shrink-0 text-muted-foreground"
                    />
                    <input
                      ref={searchRef}
                      autoFocus
                      value={taskSearch}
                      onChange={(e) => setTaskSearch(e.target.value)}
                      placeholder="Search tasks..."
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="custom-scrollbar max-h-60 overflow-y-auto p-1">
                    {filteredTasks.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No tasks found
                      </p>
                    ) : (
                      filteredTasks.map((t) => {
                        const val = t.subject || t.name;
                        const isSelected = description === val;
                        return (
                          <button
                            key={t.name}
                            onClick={() => handleTaskSelect(t)}
                            className={cn(
                              "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent",
                              isSelected && "bg-accent"
                            )}
                          >
                            <Check
                              size={14}
                              className={cn(
                                "mt-0.5 shrink-0",
                                isSelected
                                  ? "text-primary opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex min-w-0 flex-col">
                              <span className="text-foreground">
                                {t.subject || t.name}
                              </span>
                              {(t.status || t.project) && (
                                <span className="text-[11px] text-muted-foreground">
                                  {t.status || ""}
                                  {t.status && t.project ? " · " : ""}
                                  {t.project || ""}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Input
              placeholder="What are you working on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {taskError && (
              <button
                onClick={fetchTasks}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Failed to load tasks · Click to retry
              </button>
            )}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: currentProject?.color || "#888" }}
          />
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.name} value={p.name}>
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
