import { useCallback, useEffect, useState } from "react";
import { Pause, Play, Square, X } from "lucide-react";
import { v4 as uuid } from "uuid";

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
import { TooltipProvider } from "@/components/ui/tooltip";
import { HistoryView } from "@/components/History";
import { Login } from "@/components/Login";
import { ReportsView } from "@/components/Reports";
import { Sidebar } from "@/components/Sidebar";
import { TimerView } from "@/components/Timer";
import { TitleBar } from "@/components/TitleBar";
import { useEntries } from "@/hooks/useEntries";
import { useTimer } from "@/hooks/useTimer";
import { getSession, logout as ipcLogout } from "@/lib/ipc";
import { takeScreenshot } from "@/lib/ipc";
import { cn } from "@/lib/utils";
import { parseUserFromCookie } from "@/types";

import type { SprintTask, UserInfo, View } from "@/types";

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [activeView, setActiveView] = useState<View>("tasks");
  const { entries, projects, loading, addEntry, removeEntry, reload } =
    useEntries();

  const timer = useTimer();
  const [activeTask, setActiveTask] = useState<SprintTask | null>(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");

  useEffect(() => {
    getSession().then((session) => {
      const isGuest = session && /user_id=Guest/i.test(session);
      setAuthenticated(!!session && !isGuest);
      if (session && !isGuest) {
        setUserInfo(parseUserFromCookie(session));
      }
    });
  }, []);

  const handleAuthenticated = useCallback(() => {
    getSession().then((session) => {
      if (session) setUserInfo(parseUserFromCookie(session));
    });
    setAuthenticated(true);
    reload();
  }, [reload]);

  const handleLogout = useCallback(async () => {
    await ipcLogout();
    setAuthenticated(false);
    setUserInfo(null);
  }, []);

  const handleTimerStart = useCallback(
    (task: SprintTask) => {
      if (activeTask) return;
      setActiveTask(task);
      timer.start();
      takeScreenshot("start").catch(() => {});
    },
    [activeTask, timer]
  );

  const handlePause = useCallback(() => {
    timer.pause();
  }, [timer]);

  const handleResume = useCallback(() => {
    timer.resume();
  }, [timer]);

  const requestStop = useCallback(() => {
    setShowStopConfirm(true);
    setConfirmInput("");
  }, []);

  const confirmStop = useCallback(() => {
    if (!activeTask) return;
    setShowStopConfirm(false);
    setConfirmInput("");
    takeScreenshot("stop").catch(() => {});
    const result = timer.stop();
    const matchedProject = projects.find((p) => p.name === activeTask.project);
    addEntry({
      id: uuid(),
      description: activeTask.subject || activeTask.name,
      project: matchedProject?.name || projects[0]?.name || "",
      startTime: result.startTime.toISOString(),
      endTime: result.endTime.toISOString(),
      duration: result.duration,
      taskId: activeTask.name,
    });
    setActiveTask(null);
  }, [activeTask, timer, projects, addEntry]);

  const cancelStop = useCallback(() => {
    setShowStopConfirm(false);
    setConfirmInput("");
  }, []);

  const handleDiscard = useCallback(() => {
    timer.reset();
    setActiveTask(null);
  }, [timer]);

  if (authenticated === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col">
        <TitleBar />
        {!authenticated ? (
          <Login onAuthenticated={handleAuthenticated} />
        ) : loading ? (
          <div className="flex flex-1 items-center justify-center bg-background">
            <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1">
            <Sidebar
              activeView={activeView}
              onViewChange={setActiveView}
              onLogout={handleLogout}
              userInfo={userInfo}
            />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {/* Persistent Timer Bar — visible on all pages */}
              {activeTask && (
                <div className="z-20 border-b border-primary/30 bg-card px-4 py-2.5 shadow-sm shadow-primary/5 sm:px-6 md:px-8">
                  <div className="mx-auto flex max-w-3xl items-center gap-4">
                    <button
                      onClick={() => setActiveView("tasks")}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    >
                      <div className="relative flex size-2.5 shrink-0">
                        {timer.isRunning && (
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                        )}
                        <span
                          className={cn(
                            "relative inline-flex size-2.5 rounded-full",
                            timer.isRunning ? "bg-primary" : "bg-yellow-500"
                          )}
                        />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium text-foreground">
                          {activeTask.subject || activeTask.name}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {activeTask.project_name && (
                            <span className="truncate">
                              {activeTask.project_name}
                            </span>
                          )}
                          {activeTask.status && (
                            <>
                              <span className="text-border">·</span>
                              <span>{activeTask.status}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>

                    <span className="min-w-[80px] text-center font-mono text-xl font-bold tabular-nums tracking-wider text-foreground">
                      {formatElapsed(timer.elapsed)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {timer.isRunning ? (
                        <Button
                          size="icon"
                          variant="secondary"
                          className="size-8 rounded-full bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                          onClick={handlePause}
                        >
                          <Pause size={14} />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          className="size-8 rounded-full"
                          onClick={handleResume}
                        >
                          <Play size={14} fill="currentColor" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="destructive"
                        className="size-8 rounded-full"
                        onClick={requestStop}
                      >
                        <Square size={12} fill="currentColor" />
                      </Button>
                      {!timer.isRunning && timer.elapsed > 0 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 rounded-full text-muted-foreground hover:text-destructive"
                          onClick={handleDiscard}
                          title="Discard"
                        >
                          <X size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-background p-4 sm:p-6 md:p-8">
                {activeView === "tasks" && (
                  <TimerView
                    projects={projects}
                    timer={timer}
                    activeTask={activeTask}
                    onTimerStart={handleTimerStart}
                  />
                )}
                {activeView === "history" && (
                  <HistoryView
                    entries={entries}
                    projects={projects}
                    onDelete={removeEntry}
                  />
                )}
                {activeView === "reports" && (
                  <ReportsView entries={entries} projects={projects} />
                )}
              </main>
            </div>
          </div>
        )}

        {/* Stop Confirmation Dialog — works from any page */}
        <Dialog
          open={showStopConfirm}
          onOpenChange={(open) => {
            if (!open) cancelStop();
          }}
        >
          <DialogContent showCloseButton={false} className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Square size={16} className="text-destructive" />
                Stop Timer
              </DialogTitle>
              <DialogDescription>
                Type the task ID{" "}
                <span className="font-mono font-semibold text-foreground">
                  {activeTask?.name}
                </span>{" "}
                to confirm and save the time entry.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-medium text-foreground">
                  {activeTask?.subject}
                </p>
                <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-primary">
                  {formatElapsed(timer.elapsed)}
                </span>
              </div>
              <Input
                autoFocus
                placeholder={activeTask?.name ?? "Task ID"}
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && confirmInput === activeTask?.name)
                    confirmStop();
                }}
                className="font-mono"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={cancelStop}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={confirmInput !== activeTask?.name}
                onClick={confirmStop}
                className="gap-2"
              >
                <Square size={14} fill="currentColor" />
                Stop & Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
