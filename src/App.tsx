import { useState, useEffect, useCallback } from "react";
import { TitleBar } from "./components/TitleBar";
import { Login } from "./components/Login";
import { Sidebar } from "./components/Sidebar";
import { TimerView } from "./components/Timer";
import { HistoryView } from "./components/History";
import { ReportsView } from "./components/Reports";
import { useEntries } from "./hooks/useEntries";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSession, logout as ipcLogout } from "./lib/ipc";
import type { View } from "./types";

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>("timer");
  const { entries, projects, loading, addEntry, removeEntry, reload } =
    useEntries();

  useEffect(() => {
    getSession().then((session) => {
      const isGuest = session && /user_id=Guest/i.test(session);
      setSessionId(isGuest ? null : session);
      setAuthenticated(!!session && !isGuest);
    });
  }, []);

  const handleAuthenticated = useCallback(() => {
    getSession().then(setSessionId);
    setAuthenticated(true);
    reload();
  }, [reload]);

  const handleLogout = useCallback(async () => {
    await ipcLogout();
    setAuthenticated(false);
  }, []);

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
          <div className="flex flex-1 overflow-hidden">
            <Sidebar
              activeView={activeView}
              onViewChange={setActiveView}
              onLogout={handleLogout}
              sessionId={sessionId}
            />
            <main className="custom-scrollbar flex-1 overflow-y-auto bg-background p-8">
              {activeView === "timer" && (
                <TimerView projects={projects} onSave={addEntry} />
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
        )}
      </div>
    </TooltipProvider>
  );
}
