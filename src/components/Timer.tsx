import { useState } from "react";
import { Play, Square, Pause, RotateCcw } from "lucide-react";
import { v4 as uuid } from "uuid";
import { useTimer } from "../hooks/useTimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TimeEntry, Project } from "../types";

interface TimerViewProps {
  projects: Project[];
  onSave: (entry: TimeEntry) => void;
}

function formatElapsed(ms: number): { h: string; m: string; s: string } {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return {
    h: h.toString().padStart(2, "0"),
    m: m.toString().padStart(2, "0"),
    s: s.toString().padStart(2, "0"),
  };
}

export function TimerView({ projects, onSave }: TimerViewProps) {
  const timer = useTimer();
  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState(
    projects[0]?.name || ""
  );

  const handleStop = () => {
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
  };

  const currentProject = projects.find((p) => p.name === selectedProject);
  const time = formatElapsed(timer.elapsed);
  const isActive = timer.isRunning || timer.elapsed > 0;

  return (
    <div className="flex min-h-[calc(100vh-36px-64px)] flex-col items-center justify-center gap-8">
      {/* Timer Ring */}
      <div
        className={cn(
          "flex size-[260px] items-center justify-center rounded-full border-2 bg-card transition-all duration-300",
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
            {[
              { val: time.h, label: "hrs" },
              { val: time.m, label: "min" },
              { val: time.s, label: "sec" },
            ].map((unit, i) => (
              <div key={unit.label} className="flex items-baseline">
                {i > 0 && (
                  <span className="mx-0.5 pt-0.5 text-[28px] font-bold text-muted-foreground">
                    :
                  </span>
                )}
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-extrabold tabular-nums tracking-wide text-foreground">
                    {unit.val}
                  </span>
                  <span className="mt-1 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
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
            onClick={timer.start}
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

      {/* Form */}
      <div
        className={cn(
          "flex w-full max-w-sm flex-col gap-3 transition-opacity duration-300",
          isActive ? "opacity-100" : "opacity-60 focus-within:opacity-100"
        )}
      >
        <Input
          placeholder="What are you working on?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
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
